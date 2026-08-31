"""Entity resolution / coreference across raw sources.

The pipeline's per-chunk extraction (synthesizer.py's
CHUNK_EXTRACTION_SYSTEM_PROMPT) returns entity *mentions* — a name string
per chunk, with no notion that "Mira Chen", "Mira", and
"mira.chen@auroralabs.example" (a From: header, a first-name-only mention in
a transcript, and a full name in a spec) are the same person. That means
the "topic graph" `linker.py` builds is really a mention graph, not an
entity graph. This module resolves mentions into clusters.

Same tiered-degradation shape as hybrid_retrieval.py (task #5), for the
same reason: a dependency-free heuristic tier that always works, an
optional embedding-similarity tier, and an optional LLM-adjudication tier
for the pairs the earlier tiers can't confidently call — each tier only
runs on what the previous one left ambiguous, not on everything.

Deliberately conservative: a hard negative case in this repo's own corpus
(Alex Kim, Alex Rivera, and Sam Rivera are three *different* people who
share a first or last name) is exactly why the heuristic tier only
auto-merges on strong evidence (exact match, subset-of-full-name, or an
email's local part matching a name) and merely *escalates* — rather than
merges — anything weaker for a smarter tier or a human to decide, instead
of guessing from name overlap alone.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from difflib import SequenceMatcher

from hybrid_retrieval import EmbedFn, cosine_similarity

EMAIL_RE = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.-]+$")


@dataclass(frozen=True)
class Mention:
    name: str
    source: str  # raw file path (or doc path) the mention came from
    description: str = ""


@dataclass
class EntityCluster:
    id: str
    canonical_name: str
    aliases: set[str] = field(default_factory=set)
    mentions: list[Mention] = field(default_factory=list)

    @property
    def sources(self) -> set[str]:
        return {m.source for m in self.mentions}


@dataclass(frozen=True)
class ResolutionConfig:
    heuristic_merge_threshold: float = 0.85
    heuristic_review_threshold: float = 0.55
    embedding_merge_threshold: float = 0.90
    embedding_review_threshold: float = 0.75


DEFAULT_CONFIG = ResolutionConfig()

ENTITY_ADJUDICATION_SYSTEM_PROMPT = """You resolve entity coreference for a personal wiki.

Given two name/label strings extracted from different sources, decide
whether they refer to the SAME real-world entity (the same person,
product, or organization) — not just similar-looking names. "Alex Kim" and
"Alex Rivera" are DIFFERENT people who happen to share a first name; do not
merge on partial overlap alone.

Return ONLY JSON: {"same_entity": true|false, "reason": "<one line>"}"""


def _normalize(name: str) -> str:
    name = name.strip().lower()
    name = re.sub(r"[^a-z0-9@. ]+", "", name)
    return re.sub(r"\s+", " ", name).strip()


def _email_local_part_to_name(email: str) -> str:
    local = email.split("@", 1)[0]
    parts = re.split(r"[._-]+", local)
    return " ".join(part.capitalize() for part in parts if part)


def _canonicalized_for_comparison(name: str) -> str:
    stripped = name.strip()
    if EMAIL_RE.match(stripped):
        return _normalize(_email_local_part_to_name(stripped))
    return _normalize(stripped)


def heuristic_similarity(a: str, b: str) -> float:
    """Dependency-free string similarity in [0, 1]. Handles the common
    cases without any API: exact match, one name's tokens being a subset of
    the other's (e.g. "Mira" vs "Mira Chen"), and an email's local part
    matching a plain name (e.g. "mira.chen@auroralabs.example" vs "Mira
    Chen") — then falls back to a generic character-sequence ratio for
    everything else, which is deliberately weak (SequenceMatcher on short
    names rewards accidental overlap), which is why only the
    strong-evidence cases below reach the auto-merge threshold."""
    na, nb = _canonicalized_for_comparison(a), _canonicalized_for_comparison(b)
    if na == nb:
        return 1.0

    tokens_a, tokens_b = set(na.split()), set(nb.split())
    if tokens_a and tokens_b and (tokens_a <= tokens_b or tokens_b <= tokens_a):
        return 0.85

    return SequenceMatcher(None, na, nb).ratio()


class _UnionFind:
    def __init__(self, ids: list[str]) -> None:
        self.parent = {i: i for i in ids}

    def find(self, x: str) -> str:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a: str, b: str) -> None:
        root_a, root_b = self.find(a), self.find(b)
        if root_a != root_b:
            self.parent[root_a] = root_b


def _llm_confirms_same_entity(a: str, b: str, llm) -> bool:
    raw = llm.generate_response(f'Name A: "{a}"\nName B: "{b}"', ENTITY_ADJUDICATION_SYSTEM_PROMPT, temperature=0.0)
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return False
    try:
        data = json.loads(match.group())
    except json.JSONDecodeError:
        return False
    return bool(data.get("same_entity", False))


def _pick_canonical_name(names: list[str]) -> str:
    """Prefer a human-readable full name (has a space, isn't an email) over
    an email address or a bare first name — an email happening to be the
    longest string in a cluster shouldn't make it the display name."""
    full_names = [n for n in names if not EMAIL_RE.match(n.strip()) and " " in n.strip()]
    if full_names:
        return max(full_names, key=len)
    return max(names, key=len)


def resolve_entities(
    mentions: list[Mention],
    *,
    config: ResolutionConfig = DEFAULT_CONFIG,
    embed_fn: EmbedFn | None = None,
    llm=None,
) -> list[EntityCluster]:
    """Cluster mentions into resolved entities.

    Tier 1 (always runs): heuristic_similarity above
    config.heuristic_merge_threshold auto-merges; above
    config.heuristic_review_threshold but below that escalates to tier 2.
    Tier 2 (only if embed_fn given): cosine similarity of embeddings on the
    escalated pairs, same merge/review threshold split. Tier 3 (only if an
    available llm is given): LLM adjudication on whatever tier 2 still
    couldn't confidently call (or everything tier 1 escalated, if no
    embed_fn was given at all).
    """
    names = sorted({m.name for m in mentions})
    uf = _UnionFind(names)

    escalated: list[tuple[str, str]] = []
    for i, a in enumerate(names):
        for b in names[i + 1 :]:
            score = heuristic_similarity(a, b)
            if score >= config.heuristic_merge_threshold:
                uf.union(a, b)
            elif score >= config.heuristic_review_threshold:
                escalated.append((a, b))

    if embed_fn is not None and escalated:
        still_escalated: list[tuple[str, str]] = []
        for a, b in escalated:
            sim = cosine_similarity(embed_fn(a), embed_fn(b))
            if sim >= config.embedding_merge_threshold:
                uf.union(a, b)
            elif sim >= config.embedding_review_threshold:
                still_escalated.append((a, b))
        escalated = still_escalated

    if llm is not None and getattr(llm, "available", False) and escalated:
        for a, b in escalated:
            if _llm_confirms_same_entity(a, b, llm):
                uf.union(a, b)

    groups: dict[str, list[str]] = {}
    for name in names:
        groups.setdefault(uf.find(name), []).append(name)

    clusters: list[EntityCluster] = []
    for index, group_names in enumerate(sorted(groups.values(), key=lambda g: min(g))):
        canonical = _pick_canonical_name(group_names)
        group_set = set(group_names)
        cluster_mentions = [m for m in mentions if m.name in group_set]
        clusters.append(
            EntityCluster(
                id=f"entity-{index}",
                canonical_name=canonical,
                aliases=group_set,
                mentions=cluster_mentions,
            )
        )
    return clusters

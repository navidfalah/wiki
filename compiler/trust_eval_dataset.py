"""Loader/validator for the hand-labeled trust-propagation eval dataset.

data/trust_eval_dataset.json is a small, hand-labeled pilot set built from
real quotes in this repo's own data/raw/ corpus (see
documentation/21-trust-eval-dataset.md for the labeling protocol). It exists
to give the trust-propagation work (task #2/#3) something concrete to be
measured against: for each "claim group" (one factual question, e.g. "what's
the default read interval"), multiple sources make claims that corroborate,
contradict, or supersede each other, and each claim carries a gold trust
label a propagation algorithm's output can be scored against.

This module only loads and validates the dataset — it does not implement
trust propagation itself (that's rag_engine.py's sibling, still to come).
Validation includes a *grounding* check: every claim's quote must actually
appear (modulo markdown bold markers and an explicit "[...]" gap marker) in
the raw source file it cites, so the dataset can't silently drift from the
corpus it claims to be quoting.
"""

from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from email_ingest import EMAIL_EXTENSIONS, parse_eml
from models import PROJECT_ROOT, RAW_DIR

DATASET_PATH = PROJECT_ROOT / "data" / "trust_eval_dataset.json"

GOLD_LABELS = {"correct", "incorrect", "superseded", "scope_dependent", "disputed"}
RELATION_TYPES = {"corroborates", "contradicts", "supersedes"}


class DatasetValidationError(ValueError):
    """Raised when the dataset fails schema or grounding validation."""


@dataclass(frozen=True)
class Claim:
    id: str
    source_path: str
    source_type: str
    date: str
    value: str
    quote: str
    gold_label: str
    note: str = ""


@dataclass(frozen=True)
class Relation:
    from_id: str
    to_id: str
    type: str


@dataclass(frozen=True)
class ClaimGroup:
    id: str
    domain: str
    subject: str
    description: str
    claims: list[Claim] = field(default_factory=list)
    relations: list[Relation] = field(default_factory=list)


@dataclass(frozen=True)
class TrustEvalDataset:
    version: int
    description: str
    claim_groups: list[ClaimGroup] = field(default_factory=list)

    def all_claims(self) -> list[Claim]:
        return [claim for group in self.claim_groups for claim in group.claims]


def _parse_claim(raw: dict[str, Any]) -> Claim:
    return Claim(
        id=raw["id"],
        source_path=raw["source_path"],
        source_type=raw["source_type"],
        date=raw.get("date", ""),
        value=raw["value"],
        quote=raw["quote"],
        gold_label=raw["gold_label"],
        note=raw.get("note", ""),
    )


def _parse_relation(raw: dict[str, Any]) -> Relation:
    return Relation(from_id=raw["from"], to_id=raw["to"], type=raw["type"])


def _parse_group(raw: dict[str, Any]) -> ClaimGroup:
    return ClaimGroup(
        id=raw["id"],
        domain=raw.get("domain", ""),
        subject=raw["subject"],
        description=raw.get("description", ""),
        claims=[_parse_claim(c) for c in raw.get("claims", [])],
        relations=[_parse_relation(r) for r in raw.get("relations", [])],
    )


def load_trust_eval_dataset(path: Path | None = None) -> TrustEvalDataset:
    target = path or DATASET_PATH
    data = json.loads(target.read_text(encoding="utf-8"))
    return TrustEvalDataset(
        version=data.get("version", 1),
        description=data.get("description", ""),
        claim_groups=[_parse_group(g) for g in data.get("claim_groups", [])],
    )


def _normalize_for_grounding(text: str) -> str:
    """Collapse markdown emphasis and whitespace so a quote can be matched
    against raw file text without caring about `**bold**` markers or how a
    paragraph happens to be line-wrapped."""
    text = text.replace("**", "")
    return " ".join(text.split())


def _quote_is_grounded(quote: str, file_text: str) -> bool:
    """A quote is grounded if every fragment split on "[...]" (an explicit
    omitted-text marker for composite quotes spanning non-adjacent lines)
    appears verbatim (modulo markdown bold/whitespace) in the source file."""
    normalized_file = _normalize_for_grounding(file_text)
    fragments = [f.strip() for f in quote.split("[...]") if f.strip()]
    if not fragments:
        return False
    return all(_normalize_for_grounding(fragment) in normalized_file for fragment in fragments)


def validate_dataset(dataset: TrustEvalDataset, raw_dir: Path | None = None) -> list[str]:
    """Return a list of validation problems (empty list = fully valid).

    Checks: unique claim ids, gold labels from the known set, relation
    endpoints resolve to claims *within the same group*, relation types are
    known, and every claim's quote is grounded in its cited raw source file.
    """
    raw_dir = raw_dir or RAW_DIR
    problems: list[str] = []
    seen_group_ids: set[str] = set()

    for group in dataset.claim_groups:
        if group.id in seen_group_ids:
            problems.append(f"duplicate claim_group id: {group.id}")
        seen_group_ids.add(group.id)

        claim_ids = {claim.id for claim in group.claims}
        if len(claim_ids) != len(group.claims):
            problems.append(f"[{group.id}] duplicate claim ids")

        for claim in group.claims:
            if claim.gold_label not in GOLD_LABELS:
                problems.append(f"[{group.id}/{claim.id}] unknown gold_label: {claim.gold_label!r}")

            source_file = raw_dir / claim.source_path
            if not source_file.is_file():
                problems.append(f"[{group.id}/{claim.id}] source_path not found: {claim.source_path}")
                continue

            if source_file.suffix.lower() in EMAIL_EXTENSIONS:
                # .eml files are MIME documents (often quoted-printable
                # encoded) — read them the same way the pipeline does rather
                # than matching against raw, possibly-encoded bytes.
                parsed = parse_eml(source_file)
                file_text = f"{parsed.subject}\n{parsed.body_text}"
            else:
                try:
                    file_text = source_file.read_text(encoding="utf-8")
                except UnicodeDecodeError:
                    problems.append(f"[{group.id}/{claim.id}] source file is not valid UTF-8: {claim.source_path}")
                    continue

            if not _quote_is_grounded(claim.quote, file_text):
                problems.append(
                    f"[{group.id}/{claim.id}] quote not found verbatim in {claim.source_path}"
                )

        for relation in group.relations:
            if relation.type not in RELATION_TYPES:
                problems.append(f"[{group.id}] unknown relation type: {relation.type!r}")
            if relation.from_id not in claim_ids:
                problems.append(f"[{group.id}] relation 'from' id not in group: {relation.from_id}")
            if relation.to_id not in claim_ids:
                problems.append(f"[{group.id}] relation 'to' id not in group: {relation.to_id}")

    return problems


def summary_stats(dataset: TrustEvalDataset) -> dict[str, Any]:
    """Descriptive stats for a methodology write-up: counts per gold label,
    per relation type, per domain, and per claim group."""
    label_counts: Counter[str] = Counter()
    relation_counts: Counter[str] = Counter()
    domain_counts: Counter[str] = Counter()
    group_sizes: dict[str, int] = {}

    for group in dataset.claim_groups:
        domain_counts[group.domain] += len(group.claims)
        group_sizes[group.id] = len(group.claims)
        for claim in group.claims:
            label_counts[claim.gold_label] += 1
        for relation in group.relations:
            relation_counts[relation.type] += 1

    return {
        "claim_groups": len(dataset.claim_groups),
        "total_claims": sum(group_sizes.values()),
        "total_relations": sum(relation_counts.values()),
        "claims_by_gold_label": dict(label_counts),
        "relations_by_type": dict(relation_counts),
        "claims_by_domain": dict(domain_counts),
        "claims_per_group": group_sizes,
    }

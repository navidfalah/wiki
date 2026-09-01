"""Deterministic, offline cross-linking pass.

linker.py's link_page_with_llm() relies entirely on a model to notice a
mention of another topic and insert a markdown link — there is no
mechanical fallback or floor, so a page's cross-linking quality depends
completely on the model catching every mention, every time, with no way to
verify it did (see documentation/07-linking-moc-and-pages.md). This module adds a
cheap, fully deterministic pass applied *before* the LLM pass in
link_and_export_pages(): scan the page body for an exact (case-insensitive,
word-boundary, optional possessive) mention of another topic's title and
wrap its first occurrence in a markdown link.

This does not replace link_page_with_llm() — it can't catch a paraphrased
or indirect reference ("the widget" instead of "Nova Widget"), which is
exactly the kind of connection an LLM is actually good at. What it
guarantees is a floor: every *unambiguous, exact* mention of another page's
title gets linked regardless of what the model does with it, and running
the LLM pass afterward only has to find what this pass couldn't — it
should never *undo* a link this pass already added, since a well-behaved
LLM has no reason to remove an existing correct link.

Deterministic and idempotent by construction: once a mention is wrapped in
`[text](./file.md)`, it becomes a protected span (an existing markdown
link), so running this pass again on its own output links nothing new.

**On the history here, stated plainly rather than glossed over:** a
similarly-shaped `link_page_heuristic()` existed in `linker.py` once and
was deliberately deleted (commit `09a7f31`) as part of removing an entire
parallel no-LLM "heuristic mode" that duplicated extraction, synthesis,
*and* linking without an API key — two full pipelines to maintain, for a
project that decided "the compiler is LLM-only" (see README.md). This
module is not that mode resurrected. The LLM is still required
(`link_and_export_pages()` still calls `require_llm()` and still runs
`link_page_with_llm()` on every page, unconditionally) — this only adds a
narrow, single-purpose pre-pass ahead of it, not an alternative path around
it. Extraction and synthesis are untouched; nothing here lets the compiler
run without a key.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from entity_resolution import Mention, resolve_entities

_MARKDOWN_LINK_RE = re.compile(r"\[[^\]]*\]\([^)]*\)")
_CODE_FENCE_RE = re.compile(r"```.*?```", re.DOTALL)
_INLINE_CODE_RE = re.compile(r"`[^`]*`")
_HEADING_LINE_RE = re.compile(r"^#{1,6}\s.*$", re.MULTILINE)


def _spans(pattern: re.Pattern[str], body: str) -> list[tuple[int, int]]:
    return [(m.start(), m.end()) for m in pattern.finditer(body)]


def _is_within(pos: int, spans: list[tuple[int, int]]) -> bool:
    return any(start <= pos < end for start, end in spans)


@dataclass(frozen=True)
class MechanicalLinkResult:
    body: str
    linked_titles: list[str] = field(default_factory=list)


def auto_link_exact_titles(
    body: str,
    topic_index: dict[str, str],
    *,
    self_title: str,
) -> MechanicalLinkResult:
    """Wrap the first unprotected occurrence of each OTHER topic's exact
    title with a markdown link to that topic's file. Titles are tried
    longest-first, so a multi-word title (e.g. "Aurora Nova Widget") wins
    over a shorter one that happens to be a substring of it (e.g.
    "Nova Widget") rather than the shorter title matching first and
    leaving the longer phrase half-linked.
    """
    candidates = sorted(
        ((title, filename) for title, filename in topic_index.items() if title != self_title and title.strip()),
        key=lambda item: len(item[0]),
        reverse=True,
    )

    linked_titles: list[str] = []
    for title, filename in candidates:
        pattern = re.compile(rf"\b{re.escape(title)}\b(?:'s)?", re.IGNORECASE)

        # Two different kinds of "don't touch here": code fences, inline
        # code, and headings aren't real prose at all, so a match inside
        # one doesn't count as "the first mention" -- keep looking past
        # it. An existing markdown link IS a real mention, just already
        # satisfied -- if THAT'S the first real one, stop for this title
        # entirely rather than linking a later, second occurrence.
        invisible_spans = _spans(_CODE_FENCE_RE, body) + _spans(_INLINE_CODE_RE, body) + _spans(_HEADING_LINE_RE, body)
        link_spans = _spans(_MARKDOWN_LINK_RE, body)

        first_real_match = None
        for match in pattern.finditer(body):
            if _is_within(match.start(), invisible_spans):
                continue
            first_real_match = match
            break

        if first_real_match is None or _is_within(first_real_match.start(), link_spans):
            continue

        matched_text = first_real_match.group()
        replacement = f"[{matched_text}](./{filename})"
        body = body[: first_real_match.start()] + replacement + body[first_real_match.end() :]
        linked_titles.append(title)

    return MechanicalLinkResult(body=body, linked_titles=linked_titles)


def build_alias_topic_index(topic_index: dict[str, str], mentions: list[Mention]) -> dict[str, str]:
    """Expand topic_index (exact page titles only) with every alias
    entity_resolution.py's heuristic tier considers the same real-world
    entity as an existing topic title — e.g. a chunk mentioning bare
    "Mira" alongside another mentioning "Mira Chen" clusters them together;
    if "Mira Chen" is a real topic_index title, "Mira" gets added too,
    pointing at the same file. auto_link_exact_titles() only ever matches
    exact strings, so without this it can only catch a page's own full
    title, never the shorter/alternate names people actually write in
    prose.

    Heuristic tier only (no embed_fn/llm passed to resolve_entities()) —
    offline and deterministic, the same "mechanical, no live model needed"
    property as the rest of this module. A mention that would need the
    embedding or LLM tier to resolve is left alone rather than guessed at;
    entity_resolution.py's own hard-negative design (Alex Kim vs. Alex
    Rivera) already keeps the heuristic tier itself conservative.

    Only ever ADDS entries — an alias never overrides or removes an
    existing exact topic_index mapping, so a real topic title always wins
    over an alias-derived one for the same string.
    """
    if not mentions:
        return dict(topic_index)

    title_by_lower = {title.lower(): filename for title, filename in topic_index.items()}
    clusters = resolve_entities(mentions)

    expanded = dict(topic_index)
    for cluster in clusters:
        matched_filename = next(
            (title_by_lower[alias.lower()] for alias in cluster.aliases if alias.lower() in title_by_lower),
            None,
        )
        if matched_filename is None:
            continue
        for alias in cluster.aliases:
            if alias not in expanded:
                expanded[alias] = matched_filename

    return expanded


def mentions_from_extractions(extractions: dict) -> list[Mention]:
    """Build the Mention list build_alias_topic_index() needs from
    main.py's extractions payload (compiler/synthesizer.py's
    extract_topics_from_raw_files() output) — every entity name each raw
    chunk's extraction step found, attributed to that chunk's source file.
    """
    mentions: list[Mention] = []
    for file_entry in extractions.get("files", []):
        source = file_entry.get("source", "")
        for chunk in file_entry.get("chunks", []):
            for entity in chunk.get("entities", []):
                name = str(entity.get("name", "")).strip()
                if name:
                    mentions.append(Mention(name=name, source=source))
    return mentions

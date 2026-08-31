"""Offline, LLM-free faithfulness proxy: lexical (content-word) overlap
between a piece of generated text and its cited source material.

Built specifically to answer a question this project's evaluation suite
could not answer in this environment: extraction_critic_eval.py and
faithfulness_eval.py's generated-mode tier both need OPENAI_API_KEY, which
has never been available here, and standing up a local model instead (the
obvious workaround) is blocked too — huggingface.co is denied by this
session's egress policy, and downloading a GGUF file some other way would
be routing around a reported organizational block, which this project does
not do. Rather than defer the "is any of this actually grounded" question a
fourth time, this module implements a technique the RAG-evaluation
literature documents as exactly this kind of fallback: a lexical/n-gram
overlap "Unsupported Sentence Ratio" used as a cheap, offline pre-filter
before a full LLM judge (see the D-RAG Evaluator's USR metric, and the
general "layered verification" pattern described in current RAG-evaluation
writeups — documentation/28-faithfulness-evaluation.md links the sources).

**What this is not.** The literature is explicit that pure lexical overlap
"lags behind LLM judges" and "misses errors that leave surface overlap
intact" — a sentence can be a legitimate paraphrase of a grounded fact and
still score low here, and a sentence can share many words with a source
while asserting something the source doesn't actually say. This is a
one-directional, conservative-by-construction signal (low overlap after a
generous threshold is *worth a look*, not proof of hallucination) — never a
replacement for extraction_critic.py's LLM critic or
faithfulness_eval.py's judge_faithfulness() once either is reachable.

Applied to two things:
1. Any candidate text vs. its source text (score_text_against_sources()) —
   reusable wherever a same-shape check is needed, live-model or not.
2. The 174 wiki pages already committed under wiki-app/docs/ — real,
   historically LLM-generated content from an earlier session that had API
   access, each carrying a self-reported "## Sources" file list
   (check_corpus_groundedness()). This gives real, computed numbers against
   real generated text today, instead of another fixture-only mechanism
   test — with the honest caveat that the source list is self-reported by
   the model that wrote the page, not an independently verified mapping.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

from models import OUTPUT_DIR, RAW_DIR

_WORD_RE = re.compile(r"[a-z0-9]+")

# A small, generic stopword list -- not exhaustive, just enough to keep
# "the tool was based on the plan" from scoring as 100% supported by any
# sentence that happens to contain "the"/"was"/"on".
_STOPWORDS = frozenset(
    """
    a an the is are was were be been being and or but if then of to in on
    at for with as by from that this these those it its their his her he
    she they we you i not no do does did has have had will would can
    could should may might also than so such which who whom about into
    over under between per via based summary overview according general
    according while when where how what
    """.split()
)

_FRAMING_PREFIXES = (
    "based on",
    "according to",
    "in summary",
    "overall",
    "in general",
    "to summarize",
    "in conclusion",
)

_MARKDOWN_LINK_RE = re.compile(r"\[([^\]]*)\]\([^)]*\)")
_CODE_FENCE_RE = re.compile(r"```.*?```", re.DOTALL)
_INLINE_CODE_RE = re.compile(r"`([^`]*)`")
_BOLD_ITALIC_RE = re.compile(r"\*{1,3}([^*]+)\*{1,3}")
_BULLET_PREFIX_RE = re.compile(r"^\s*[*\-]\s+", re.MULTILINE)
_HEADING_RE = re.compile(r"^#{1,6}\s.*$", re.MULTILINE)


def _content_tokens(text: str) -> set[str]:
    return {w for w in _WORD_RE.findall(text.lower()) if w not in _STOPWORDS and len(w) > 2}


def clean_markdown_to_prose(text: str) -> str:
    """Strip markdown structure down to plain-ish prose: drop code fences
    and headings entirely, unwrap links/bold/italic/inline-code to their
    inner text, drop leading bullet markers. Not a full markdown parser —
    good enough to stop structural syntax from polluting sentence-level
    token comparisons."""
    text = _CODE_FENCE_RE.sub(" ", text)
    text = _HEADING_RE.sub(" ", text)
    text = _MARKDOWN_LINK_RE.sub(r"\1", text)
    text = _INLINE_CODE_RE.sub(r"\1", text)
    text = _BOLD_ITALIC_RE.sub(r"\1", text)
    text = _BULLET_PREFIX_RE.sub("", text)
    return text


def split_sentences(text: str) -> list[str]:
    """Naive sentence splitter — good enough for an approximate lexical
    check, not meant to handle every abbreviation/edge case."""
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


@dataclass(frozen=True)
class SentenceSupport:
    sentence: str
    support_ratio: float
    supported: bool


@dataclass(frozen=True)
class HeuristicFaithfulnessReport:
    sentence_reports: list[SentenceSupport] = field(default_factory=list)

    @property
    def checkable_count(self) -> int:
        return len(self.sentence_reports)

    @property
    def unsupported(self) -> list[SentenceSupport]:
        return [s for s in self.sentence_reports if not s.supported]

    @property
    def unsupported_rate(self) -> float:
        return len(self.unsupported) / self.checkable_count if self.checkable_count else float("nan")


def score_text_against_sources(
    candidate_text: str,
    sources_text: str,
    *,
    support_threshold: float = 0.4,
    min_content_words: int = 3,
) -> HeuristicFaithfulnessReport:
    """Score every checkable sentence in candidate_text for content-word
    overlap with sources_text. A sentence with fewer than min_content_words
    content words (too short/generic to be a checkable factual claim) or
    starting with a framing phrase is skipped entirely, not counted as
    either supported or unsupported.
    """
    source_tokens = _content_tokens(sources_text)
    reports = []
    for sentence in split_sentences(candidate_text):
        lowered = sentence.lower()
        tokens = _content_tokens(sentence)
        if len(tokens) < min_content_words:
            continue
        if lowered.startswith(_FRAMING_PREFIXES):
            continue
        ratio = len(tokens & source_tokens) / len(tokens)
        reports.append(SentenceSupport(sentence=sentence, support_ratio=ratio, supported=ratio >= support_threshold))
    return HeuristicFaithfulnessReport(sentence_reports=reports)


_SOURCES_SECTION_RE = re.compile(r"^## Sources\n(.*?)(?=\n##|\n```|\Z)", re.DOTALL | re.MULTILINE)
_SOURCE_BULLET_RE = re.compile(r"^\*\s+`([^`]+)`\s*$", re.MULTILINE)
_FRONTMATTER_RE = re.compile(r"\A---\n.*?\n---\n", re.DOTALL)


def parse_page(page_text: str) -> tuple[str, list[str]]:
    """Split a compiled wiki page into (body-before-Sources, [raw source
    paths]) — the self-reported grounding this page's own '## Sources'
    section names. Returns ("", []) for a page with no Sources section
    (e.g. the generated index/MOC page, which isn't a synthesized topic
    page in the first place)."""
    body = _FRONTMATTER_RE.sub("", page_text, count=1)
    match = re.search(r"^## Sources\n", body, re.MULTILINE)
    if not match:
        return "", []
    content_before = body[: match.start()]
    sources_match = _SOURCES_SECTION_RE.search(body)
    source_paths = _SOURCE_BULLET_RE.findall(sources_match.group(1)) if sources_match else []
    return content_before, source_paths


@dataclass(frozen=True)
class PageGroundednessResult:
    page: str
    source_paths: list[str]
    report: HeuristicFaithfulnessReport


def check_corpus_groundedness(
    docs_dir: Path = OUTPUT_DIR,
    raw_dir: Path = RAW_DIR,
    *,
    support_threshold: float = 0.4,
) -> list[PageGroundednessResult]:
    """Run score_text_against_sources() over every compiled wiki page that
    has a '## Sources' section, using that page's own self-reported source
    file list as the grounding text. Skips (does not raise on) a page
    whose source file is missing on disk, and pages with no Sources
    section at all."""
    results = []
    for page_path in sorted(docs_dir.glob("*.md")):
        page_text = page_path.read_text(encoding="utf-8")
        content_before, source_paths = parse_page(page_text)
        if not source_paths:
            continue

        source_texts = []
        for rel_path in source_paths:
            source_file = raw_dir / rel_path
            if source_file.is_file():
                source_texts.append(source_file.read_text(encoding="utf-8", errors="replace"))
        sources_text = "\n\n".join(source_texts)

        prose = clean_markdown_to_prose(content_before)
        report = score_text_against_sources(prose, sources_text, support_threshold=support_threshold)
        results.append(PageGroundednessResult(page=page_path.name, source_paths=source_paths, report=report))
    return results


if __name__ == "__main__":
    results = check_corpus_groundedness()

    total_sentences = sum(r.report.checkable_count for r in results)
    total_unsupported = sum(len(r.report.unsupported) for r in results)
    print(f"=== Offline lexical-overlap groundedness check: {len(results)} real compiled wiki pages ===")
    print(
        f"checkable sentences={total_sentences}  "
        f"flagged (below threshold)={total_unsupported}  "
        f"flagged_rate={total_unsupported / total_sentences:.2%}" if total_sentences else "no checkable sentences"
    )

    worst = sorted(results, key=lambda r: r.report.unsupported_rate, reverse=True)
    print("\nTop 10 pages by flagged rate (candidates for a real critic pass once one is reachable):")
    shown = 0
    for r in worst:
        if r.report.checkable_count == 0 or shown >= 10:
            continue
        print(f"  {r.page:45s} {len(r.report.unsupported)}/{r.report.checkable_count} flagged ({r.report.unsupported_rate:.0%})")
        shown += 1

    print("\nExample flagged sentences from the single worst page:")
    if worst and worst[0].report.unsupported:
        for s in worst[0].report.unsupported[:5]:
            print(f"  [{s.support_ratio:.0%} support] {s.sentence}")

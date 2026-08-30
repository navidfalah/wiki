"""RAG chat engine — answers questions over the compiled wiki.

This is the fourth engine alongside email_engine.py, resources_engine.py,
and the base compiler pipeline: same "one dedicated module per concern"
shape as trust.py/analytics.py/link_overrides.py. It treats
`wiki-app/docs/` (the network of pages linker.py already cross-linked) as
the corpus to search, rather than the raw pipeline chunks — so the chat
answers with the wiki's own synthesized, cross-linked knowledge, and every
citation is a page a person can click into.

Retrieval is a small dependency-free TF-IDF-style scorer (stdlib only, no
vector DB, no embeddings API) — good enough for a personal wiki's corpus
size, and it means the chat still works with zero setup beyond a compile.
Answer generation is optional on top of that: with an OPENAI_API_KEY
configured, retrieved passages are handed to the chat model to write a
grounded answer; without one, `answer_question` falls back to an extractive
answer built directly from the retrieved passages, so the feature is never
hard-blocked on API access.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from doc_utils import parse_frontmatter, strip_frontmatter
from llm_client import LLMClient
from models import OUTPUT_DIR
from text_chunking import split_text_into_chunks

_WORD_RE = re.compile(r"[a-z0-9]+")
_HEADING_LINE_RE = re.compile(r"^(#{1,6})\s+(.*)$")
_PASSAGE_MAX_CHARS = 900

CHAT_SYSTEM_PROMPT = (
    "You are the knowledge assistant for a personal wiki compiled from the "
    "user's own notes, emails, and documents. Answer the question using ONLY "
    "the numbered wiki excerpts given as context — do not use outside "
    "knowledge. After any claim drawn from an excerpt, cite it like [1]. If "
    "the excerpts don't contain the answer, say so plainly instead of "
    "guessing."
)


def _tokenize(text: str) -> list[str]:
    return _WORD_RE.findall(text.lower())


@dataclass
class Passage:
    doc_path: str
    title: str
    heading: str
    text: str
    tokens: list[str] = field(default_factory=list)


@dataclass
class ScoredPassage:
    passage: Passage
    score: float


def _split_into_passages(doc_path: str, title: str, body: str) -> list[Passage]:
    """Split a page body into heading-scoped, size-bounded passages."""
    passages: list[Passage] = []
    heading = title
    section_lines: list[str] = []

    def flush() -> None:
        section_text = "\n".join(section_lines).strip()
        section_lines.clear()
        if not section_text:
            return
        for piece in split_text_into_chunks(section_text, max_chars=_PASSAGE_MAX_CHARS):
            piece = piece.strip()
            if piece:
                passages.append(Passage(doc_path, title, heading, piece, _tokenize(piece)))

    for line in body.splitlines():
        match = _HEADING_LINE_RE.match(line)
        if match:
            flush()
            heading = match.group(2).strip()
            continue
        section_lines.append(line)
    flush()
    return passages


def build_corpus(docs_dir: Path | None = None) -> list[Passage]:
    """Load every compiled wiki page into retrievable passages."""
    docs_dir = docs_dir or OUTPUT_DIR
    passages: list[Passage] = []
    if not docs_dir.is_dir():
        return passages

    for path in sorted(docs_dir.rglob("*.md")):
        rel = str(path.relative_to(docs_dir)).replace("\\", "/")
        raw = path.read_text(encoding="utf-8")
        meta = parse_frontmatter(raw)
        title = meta.get("title") or path.stem.replace("-", " ").title()
        body = strip_frontmatter(raw)
        passages.extend(_split_into_passages(rel, title, body))

    return passages


def _document_frequencies(corpus: list[Passage]) -> dict[str, int]:
    df: dict[str, int] = {}
    for passage in corpus:
        for token in set(passage.tokens):
            df[token] = df.get(token, 0) + 1
    return df


def retrieve(query: str, corpus: list[Passage], *, top_k: int = 5) -> list[ScoredPassage]:
    """Rank passages by a TF-IDF-style overlap score against the query."""
    query_terms = set(_tokenize(query))
    if not query_terms or not corpus:
        return []

    df = _document_frequencies(corpus)
    n_docs = len(corpus)

    scored: list[ScoredPassage] = []
    for passage in corpus:
        if not passage.tokens:
            continue
        term_counts: dict[str, int] = {}
        for token in passage.tokens:
            term_counts[token] = term_counts.get(token, 0) + 1

        score = 0.0
        for term in query_terms:
            tf = term_counts.get(term, 0)
            if tf == 0:
                continue
            idf = math.log((n_docs + 1) / (df.get(term, 0) + 1)) + 1
            score += (tf / len(passage.tokens)) * idf

        if score > 0:
            scored.append(ScoredPassage(passage, score))

    scored.sort(key=lambda item: item.score, reverse=True)
    return scored[:top_k]


def _format_context(scored: list[ScoredPassage]) -> str:
    blocks = []
    for index, item in enumerate(scored, start=1):
        passage = item.passage
        blocks.append(f"[{index}] {passage.title} — {passage.heading}\n{passage.text}")
    return "\n\n".join(blocks)


def _deduped_sources(scored: list[ScoredPassage]) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    seen_docs: set[str] = set()
    for item in scored:
        passage = item.passage
        if passage.doc_path in seen_docs:
            continue
        seen_docs.add(passage.doc_path)
        sources.append(
            {
                "doc_path": passage.doc_path,
                "title": passage.title,
                "heading": passage.heading,
                "score": round(item.score, 4),
            }
        )
    return sources


def answer_question(
    query: str,
    *,
    history: list[dict[str, str]] | None = None,
    docs_dir: Path | None = None,
    llm: LLMClient | None = None,
    top_k: int = 5,
) -> dict[str, Any]:
    """Answer a question over the compiled wiki.

    Returns {"answer", "sources", "mode"} where mode is one of:
    - "empty": nothing has been compiled yet
    - "no_match": the corpus has nothing relevant to the query
    - "generated": an LLM wrote the answer from retrieved context
    - "extractive": no LLM configured (or the call failed) — the retrieved
      passages are returned directly as the answer
    """
    query = (query or "").strip()
    docs_dir = docs_dir or OUTPUT_DIR
    corpus = build_corpus(docs_dir)

    if not query:
        return {"answer": "Ask a question about anything in the wiki.", "sources": [], "mode": "empty"}

    if not corpus:
        return {
            "answer": (
                "The wiki hasn't been compiled yet, so there's nothing to search. "
                "Run the compiler pipeline first, then ask again."
            ),
            "sources": [],
            "mode": "empty",
        }

    scored = retrieve(query, corpus, top_k=top_k)
    if not scored:
        return {
            "answer": (
                "I couldn't find anything in the wiki about that. Try rephrasing, or make "
                "sure the relevant source has been compiled."
            ),
            "sources": [],
            "mode": "no_match",
        }

    sources = _deduped_sources(scored)
    client = llm or LLMClient()

    if client.available:
        context = _format_context(scored)
        history_block = ""
        if history:
            turns = "\n".join(
                f"{turn.get('role', 'user')}: {turn.get('content', '')}" for turn in history[-6:]
            )
            history_block = f"Conversation so far:\n{turns}\n\n"
        prompt = f"{history_block}Wiki excerpts:\n{context}\n\nQuestion: {query}"
        try:
            answer = client.generate_response(prompt, CHAT_SYSTEM_PROMPT, temperature=0.1)
            return {"answer": answer.strip(), "sources": sources, "mode": "generated"}
        except RuntimeError:
            pass  # fall through to the extractive answer below

    lines = ["No LLM is configured, so here are the closest matches from the wiki:"]
    for item in scored[:3]:
        passage = item.passage
        snippet = passage.text if len(passage.text) <= 400 else f"{passage.text[:400]}…"
        lines.append(f"\n**{passage.title} — {passage.heading}**\n{snippet}")
    return {"answer": "\n".join(lines), "sources": sources, "mode": "extractive"}

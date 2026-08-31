"""RAG chat engine — answers questions over the compiled wiki.

This is the fourth engine alongside email_engine.py, resources_engine.py,
and the base compiler pipeline: same "one dedicated module per concern"
shape as trust.py/analytics.py/link_overrides.py. It treats
`wiki-app/docs/` (the network of pages linker.py already cross-linked) as
the corpus to search, rather than the raw pipeline chunks — so the chat
answers with the wiki's own synthesized, cross-linked knowledge, and every
citation is a page a person can click into.

Retrieval is now hybrid_retrieval.py's three-tier stack (see
documentation/25-hybrid-retrieval.md for the design and a real BM25-vs-the-
original-TF-IDF comparison): BM25 always runs (stdlib only, no API key
needed — this is what `retrieve()` below uses, and what the chat still
works on with zero setup beyond a compile); when an LLM is configured,
`retrieve_hybrid()` additionally fuses in embedding similarity via
reciprocal rank fusion and reranks the fused shortlist with the chat model,
falling back one tier at a time (hybrid -> BM25-only) if embeddings or the
reranker call fails. Answer generation is separately optional: with an
OPENAI_API_KEY configured, retrieved passages are handed to the chat model
to write a grounded answer; without one, `answer_question` falls back to an
extractive answer built directly from the retrieved passages, so the
feature is never hard-blocked on API access.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import hybrid_retrieval
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


def _index_corpus(corpus: list[Passage]) -> tuple[list[hybrid_retrieval.Doc], dict[str, Passage]]:
    """Passages don't carry a stable id (they're rebuilt fresh from disk on
    every call), so index positions are used as ids for the duration of one
    retrieval call — never persisted, never compared across calls."""
    docs = [hybrid_retrieval.Doc(id=str(i), text=p.text, tokens=p.tokens) for i, p in enumerate(corpus)]
    by_id = {str(i): p for i, p in enumerate(corpus)}
    return docs, by_id


def retrieve(query: str, corpus: list[Passage], *, top_k: int = 5) -> list[ScoredPassage]:
    """BM25 ranking over the corpus — always available, no API key needed.
    See documentation/25-hybrid-retrieval.md for how this compares to the
    original ad hoc TF-IDF-style scorer it replaced."""
    docs, by_id = _index_corpus(corpus)
    ranked = hybrid_retrieval.bm25_rank(query, docs, top_k=top_k)
    return [ScoredPassage(by_id[r.doc_id], r.score) for r in ranked]


def retrieve_hybrid(
    query: str,
    corpus: list[Passage],
    *,
    top_k: int = 5,
    llm: LLMClient | None = None,
    rerank: bool = True,
) -> list[ScoredPassage]:
    """BM25, optionally fused with embedding similarity (reciprocal rank
    fusion) and reranked by the LLM, when one is configured. Degrades one
    tier at a time — hybrid+rerank -> hybrid -> BM25-only — on any failure,
    so this is always safe to call regardless of API availability."""
    docs, by_id = _index_corpus(corpus)
    shortlist_k = max(top_k * 3, top_k)

    bm25_top = hybrid_retrieval.bm25_rank(query, docs, top_k=shortlist_k)
    client = llm or LLMClient()
    if not client.available:
        return [ScoredPassage(by_id[r.doc_id], r.score) for r in bm25_top[:top_k]]

    fused = bm25_top
    try:
        embedding_top = hybrid_retrieval.embedding_rank(query, docs, client.embed_text, top_k=shortlist_k)
        fused = hybrid_retrieval.reciprocal_rank_fusion([bm25_top, embedding_top], top_k=shortlist_k)
    except RuntimeError:
        pass  # embeddings unavailable/failed — fall back to BM25-only fusion input

    if rerank and fused:
        docs_by_id = {d.id: d for d in docs}
        candidates = [docs_by_id[r.doc_id] for r in fused[: max(top_k * 2, top_k)] if r.doc_id in docs_by_id]
        try:
            reranked = hybrid_retrieval.llm_rerank(query, candidates, client, top_n=top_k)
            return [ScoredPassage(by_id[r.doc_id], r.score) for r in reranked]
        except RuntimeError:
            pass  # reranker unavailable/failed — fall back to the fused ranking

    return [ScoredPassage(by_id[r.doc_id], r.score) for r in fused[:top_k]]


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

    client = llm or LLMClient()
    scored = retrieve_hybrid(query, corpus, top_k=top_k, llm=client)
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

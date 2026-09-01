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

Optionally, `retrieve_hybrid(..., vector_store=...)` backs the embedding
tier with a persistent vector_store.py VectorStore (task #11) instead of
re-embedding the whole corpus from scratch on every call —
`sync_corpus_to_vector_store()` embeds only passages the store doesn't
already have, keyed by a stable content hash (`_passage_id`), so a second
call against an unchanged corpus does zero new embedding calls. See
documentation/31-vector-graph-storage-and-scalability.md for why this
matters (a naive from-scratch embed is the cost `retrieve_hybrid()` paid
without it) and documentation/25-hybrid-retrieval.md for how it fits the
rest of the retrieval stack. Without a vector_store, behavior is unchanged
from before this wiring existed.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterator

import hybrid_retrieval
from doc_utils import parse_frontmatter, strip_frontmatter
from llm_client import LLMClient
from models import OUTPUT_DIR
from text_chunking import split_text_into_chunks
from vector_store import VectorRecord, VectorStore

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


def _passage_id(passage: Passage) -> str:
    """A stable content-hash id — same (doc_path, heading, text) always
    hashes to the same id, across calls and across process restarts. That's
    what makes VectorStore persistence meaningful: if a passage's text
    changes, its id changes too, so a stale embedding is never silently
    reused for changed content, and sync_corpus_to_vector_store() can tell
    "already embedded" from "needs embedding" without comparing text.
    """
    key = f"{passage.doc_path}\x1f{passage.heading}\x1f{passage.text}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]


def _index_corpus(corpus: list[Passage]) -> tuple[list[hybrid_retrieval.Doc], dict[str, Passage]]:
    docs = [hybrid_retrieval.Doc(id=_passage_id(p), text=p.text, tokens=p.tokens) for p in corpus]
    by_id = {_passage_id(p): p for p in corpus}
    return docs, by_id


def sync_corpus_to_vector_store(corpus: list[Passage], llm: LLMClient, store: VectorStore) -> int:
    """Embed and upsert every passage not already present in `store`,
    keyed by _passage_id(). Existing entries are never re-embedded — that's
    the entire point of a persistent store versus re-embedding the whole
    corpus on every retrieve_hybrid() call. Returns how many new embeddings
    were actually computed (0 on a second call against an unchanged corpus).
    """
    docs, _ = _index_corpus(corpus)
    to_embed = [d for d in docs if store.get(d.id) is None]
    if not to_embed:
        return 0
    records = [VectorRecord(id=d.id, text=d.text, embedding=llm.embed_text(d.text)) for d in to_embed]
    store.upsert_many(records)
    return len(records)


def prune_stale_vector_store_entries(corpus: list[Passage], store: VectorStore) -> int:
    """Remove store entries that don't correspond to any passage in the
    current corpus — either the source page was deleted/changed (content-
    hash ids mean a changed passage gets a new id, orphaning the old one)
    or the store was built from a different corpus entirely. Returns how
    many entries were removed."""
    docs, _ = _index_corpus(corpus)
    live_ids = {d.id for d in docs}
    stale_ids = [record.id for record in store.all_records() if record.id not in live_ids]
    for stale_id in stale_ids:
        store.delete(stale_id)
    return len(stale_ids)


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
    vector_store: VectorStore | None = None,
) -> list[ScoredPassage]:
    """BM25, optionally fused with embedding similarity (reciprocal rank
    fusion) and reranked by the LLM, when one is configured. Degrades one
    tier at a time — hybrid+rerank -> hybrid -> BM25-only — on any failure,
    so this is always safe to call regardless of API availability.

    vector_store, when given, backs the embedding tier with a persistent
    VectorStore (task #11) instead of re-embedding the whole corpus from
    scratch every call: sync_corpus_to_vector_store() embeds only passages
    the store doesn't already have (by content-hash id), then the query is
    matched against everything stored. A store can accumulate entries from
    corpora other than the current one (or from since-deleted/changed
    passages), so search results are filtered to ids present in *this*
    call's corpus before fusion — see prune_stale_vector_store_entries() to
    actually remove those, which this function does not do on its own.
    """
    docs, by_id = _index_corpus(corpus)
    shortlist_k = max(top_k * 3, top_k)

    bm25_top = hybrid_retrieval.bm25_rank(query, docs, top_k=shortlist_k)
    client = llm or LLMClient()
    if not client.available:
        return [ScoredPassage(by_id[r.doc_id], r.score) for r in bm25_top[:top_k]]

    fused = bm25_top
    try:
        if vector_store is not None:
            sync_corpus_to_vector_store(corpus, client, vector_store)
            query_embedding = client.embed_text(query)
            live_ids = {d.id for d in docs}
            # Search the whole store, not just shortlist_k — a store can
            # hold entries the brute-force ranking would put outside the
            # top shortlist_k *before* filtering out ids from other
            # corpora, which would wrongly shrink this corpus's results.
            store_hits = [
                (record_id, score)
                for record_id, score in vector_store.search(query_embedding, top_k=vector_store.count())
                if record_id in live_ids
            ][:shortlist_k]
            embedding_top = [hybrid_retrieval.RankedDoc(record_id, score) for record_id, score in store_hits]
        else:
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


def _filter_corpus(corpus: list[Passage], doc_scope: list[str] | None) -> list[Passage]:
    """Restrict the corpus to passages from the given doc_path allowlist.
    None/empty means no filter -- the full corpus is searched."""
    if not doc_scope:
        return corpus
    scope = set(doc_scope)
    return [p for p in corpus if p.doc_path in scope]


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


def _extractive_answer(scored: list[ScoredPassage]) -> str:
    lines = ["No LLM is configured, so here are the closest matches from the wiki:"]
    for item in scored[:3]:
        passage = item.passage
        snippet = passage.text if len(passage.text) <= 400 else f"{passage.text[:400]}…"
        lines.append(f"\n**{passage.title} — {passage.heading}**\n{snippet}")
    return "\n".join(lines)


def _build_prompt(query: str, scored: list[ScoredPassage], history: list[dict[str, str]] | None) -> str:
    context = _format_context(scored)
    history_block = ""
    if history:
        turns = "\n".join(f"{turn.get('role', 'user')}: {turn.get('content', '')}" for turn in history[-6:])
        history_block = f"Conversation so far:\n{turns}\n\n"
    return f"{history_block}Wiki excerpts:\n{context}\n\nQuestion: {query}"


def _retrieve(
    query: str,
    *,
    docs_dir: Path | None,
    llm: LLMClient | None,
    top_k: int,
    doc_scope: list[str] | None,
) -> dict[str, Any]:
    """Shared corpus-build + retrieve + dedupe-sources step used by both
    answer_question() and answer_question_stream(). Returns either
    {"early": {...}} (the empty/no_match response, ready to return as-is)
    or {"scored": [...], "sources": [...], "client": LLMClient}."""
    query = (query or "").strip()
    docs_dir = docs_dir or OUTPUT_DIR
    corpus = _filter_corpus(build_corpus(docs_dir), doc_scope)

    if not query:
        return {"early": {"answer": "Ask a question about anything in the wiki.", "sources": [], "mode": "empty"}}

    if not corpus:
        return {
            "early": {
                "answer": (
                    "The wiki hasn't been compiled yet, so there's nothing to search. "
                    "Run the compiler pipeline first, then ask again."
                ),
                "sources": [],
                "mode": "empty",
            }
        }

    client = llm or LLMClient()
    scored = retrieve_hybrid(query, corpus, top_k=top_k, llm=client)
    if not scored:
        return {
            "early": {
                "answer": (
                    "I couldn't find anything in the wiki about that. Try rephrasing, or make "
                    "sure the relevant source has been compiled."
                ),
                "sources": [],
                "mode": "no_match",
            }
        }

    return {"scored": scored, "sources": _deduped_sources(scored), "client": client}


def answer_question(
    query: str,
    *,
    history: list[dict[str, str]] | None = None,
    docs_dir: Path | None = None,
    llm: LLMClient | None = None,
    top_k: int = 5,
    doc_scope: list[str] | None = None,
) -> dict[str, Any]:
    """Answer a question over the compiled wiki.

    doc_scope, when given, restricts retrieval to passages from those
    doc_paths (e.g. a chat session scoped to a subset of resources).

    Returns {"answer", "sources", "mode"} where mode is one of:
    - "empty": nothing has been compiled yet
    - "no_match": the corpus has nothing relevant to the query
    - "generated": an LLM wrote the answer from retrieved context
    - "extractive": no LLM configured (or the call failed) — the retrieved
      passages are returned directly as the answer
    """
    retrieval = _retrieve(query, docs_dir=docs_dir, llm=llm, top_k=top_k, doc_scope=doc_scope)
    if "early" in retrieval:
        return retrieval["early"]

    scored, sources, client = retrieval["scored"], retrieval["sources"], retrieval["client"]

    if client.available:
        prompt = _build_prompt(query.strip(), scored, history)
        try:
            answer = client.generate_response(prompt, CHAT_SYSTEM_PROMPT, temperature=0.1)
            return {"answer": answer.strip(), "sources": sources, "mode": "generated"}
        except RuntimeError:
            pass  # fall through to the extractive answer below

    return {"answer": _extractive_answer(scored), "sources": sources, "mode": "extractive"}


def answer_question_stream(
    query: str,
    *,
    history: list[dict[str, str]] | None = None,
    docs_dir: Path | None = None,
    llm: LLMClient | None = None,
    top_k: int = 5,
    doc_scope: list[str] | None = None,
) -> Iterator[dict[str, Any]]:
    """Streaming counterpart to answer_question(). Yields event dicts:
    {"type": "sources", "sources": [...]} once retrieval finishes, then one
    or more {"type": "delta", "text": "..."} chunks as the answer is
    generated (or a single chunk carrying the extractive fallback when no
    LLM is configured), then a final {"type": "done", "mode", "answer"}.
    """
    retrieval = _retrieve(query, docs_dir=docs_dir, llm=llm, top_k=top_k, doc_scope=doc_scope)
    if "early" in retrieval:
        early = retrieval["early"]
        yield {"type": "sources", "sources": early["sources"]}
        yield {"type": "done", "mode": early["mode"], "answer": early["answer"]}
        return

    scored, sources, client = retrieval["scored"], retrieval["sources"], retrieval["client"]
    yield {"type": "sources", "sources": sources}

    if client.available:
        prompt = _build_prompt(query.strip(), scored, history)
        try:
            full_text = ""
            for delta in client.stream_response(prompt, CHAT_SYSTEM_PROMPT, temperature=0.1):
                full_text += delta
                yield {"type": "delta", "text": delta}
            yield {"type": "done", "mode": "generated", "answer": full_text.strip()}
            return
        except RuntimeError:
            pass  # fall through to the extractive answer below

    extractive = _extractive_answer(scored)
    yield {"type": "delta", "text": extractive}
    yield {"type": "done", "mode": "extractive", "answer": extractive}

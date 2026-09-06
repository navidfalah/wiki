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
already have, keyed by a stable content hash (rag_types.passage_id), so a second
call against an unchanged corpus does zero new embedding calls. See
documentation/31-vector-graph-storage-and-scalability.md for why this
matters (a naive from-scratch embed is the cost `retrieve_hybrid()` paid
without it) and documentation/25-hybrid-retrieval.md for how it fits the
rest of the retrieval stack. Without a vector_store, behavior is unchanged
from before this wiring existed.
"""

from __future__ import annotations

import re
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import hybrid_retrieval
import rag_architectures
import rag_settings
import synthesizer
from doc_utils import parse_frontmatter, strip_frontmatter
from faithfulness_heuristic import score_text_against_sources
from llm_client import LLMClient
from models import OUTPUT_DIR, PROJECT_ROOT, RAW_DIR
from rag_types import Passage, ScoredPassage, index_corpus, passage_id, tokenize
from text_chunking import split_text_into_chunks
from vector_store import VectorRecord, VectorStore

# Re-exported so existing call sites/tests (`rag_engine.Passage`,
# `rag_engine.ScoredPassage`) keep working now that the types live in
# rag_types.py -- see that module's docstring for why they moved.
__all__ = [
    "Passage",
    "ScoredPassage",
    "build_corpus",
    "build_raw_corpus",
    "retrieve",
    "retrieve_hybrid",
    "answer_question",
    "answer_question_stream",
]

# Backward-compatible alias: this was a module-private function here before
# passage_id() moved to rag_types.py; kept so existing call sites/tests
# (`rag_engine._passage_id`) don't need to change.
_passage_id = passage_id

_HEADING_LINE_RE = re.compile(r"^(#{1,6})\s+(.*)$")
_PASSAGE_MAX_CHARS = 900

# Backs RagSettings.use_vector_store (see rag_settings.py / the RAG
# Architecture settings page) -- a single persistent store shared across
# calls, so repeated questions don't re-embed the whole corpus each time.
VECTOR_STORE_FILE = PROJECT_ROOT / "data" / "vector_store.sqlite"

# Chat can search either the compiled wiki (default) or the raw, uncompiled
# inputs it was built from -- see build_raw_corpus() below. Every prompt/
# message that names the corpus takes a `source` of "wiki" or "raw" and
# picks its wording from these two labels so the model (and the user-facing
# fallback text) never claims to be looking at the wiki while actually
# searching raw notes, or vice versa.
_CORPUS_LABELS = {"wiki": "wiki", "raw": "raw sources"}


def _corpus_label(source: str) -> str:
    return _CORPUS_LABELS.get(source, _CORPUS_LABELS["wiki"])


def _system_prompt(source: str) -> str:
    if source == "raw":
        return (
            "You are the knowledge assistant for a personal wiki's raw, uncompiled "
            "inputs -- the user's own notes, emails, transcripts, and documents "
            "before they were synthesized into wiki pages. Answer the question "
            "using ONLY the numbered source excerpts given as context — do not "
            "use outside knowledge. After any claim drawn from an excerpt, cite "
            "it like [1]. If the excerpts don't contain the answer, say so "
            "plainly instead of guessing."
        )
    return (
        "You are the knowledge assistant for a personal wiki compiled from the "
        "user's own notes, emails, and documents. Answer the question using ONLY "
        "the numbered wiki excerpts given as context — do not use outside "
        "knowledge. After any claim drawn from an excerpt, cite it like [1]. If "
        "the excerpts don't contain the answer, say so plainly instead of "
        "guessing."
    )


# Backward-compatible alias for existing call sites/tests that reference the
# wiki-mode prompt directly.
CHAT_SYSTEM_PROMPT = _system_prompt("wiki")


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
                passages.append(Passage(doc_path, title, heading, piece, tokenize(piece)))

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


def _split_raw_chunk_into_passages(chunk: synthesizer.RawChunk) -> list[Passage]:
    """Split one raw-file chunk into size-bounded passages, mirroring
    _split_into_passages() for compiled pages. doc_path is the file's path
    relative to data/raw/ (not a wiki .md path) so citations point back at
    the actual source file."""
    title = Path(chunk.source_path).name
    heading = f"Part {chunk.chunk_index + 1}"
    passages: list[Passage] = []
    for piece in split_text_into_chunks(chunk.text, max_chars=_PASSAGE_MAX_CHARS):
        piece = piece.strip()
        if piece:
            passages.append(Passage(chunk.source_path, title, heading, piece, tokenize(piece)))
    return passages


def build_raw_corpus(raw_dir: Path | None = None) -> list[Passage]:
    """Load every raw source file under data/raw/ into retrievable passages
    -- the "sources/inputs" counterpart to build_corpus()'s compiled wiki
    pages, backing the chat's raw-sources mode.

    Deliberately never calls an LLM: it reads chunks one file at a time via
    synthesizer.read_chunks_for_path(llm=None) rather than
    synthesizer.read_raw_chunks(), so an unconfigured/expensive captioning
    call can't fire on every chat message. Images (the one raw file type
    synthesizer always requires an LLM for) degrade to a short placeholder
    passage instead of blocking the whole corpus build, and any other file
    that fails to read/parse is skipped the same way -- same never-hard-
    blocked spirit as the rest of this module.
    """
    root = raw_dir or RAW_DIR
    passages: list[Passage] = []
    for path in synthesizer.discover_raw_source_files(root):
        try:
            chunks = synthesizer.read_chunks_for_path(path, root, None)
        except Exception:
            rel = str(path.relative_to(root)).replace("\\", "/")
            chunks = [synthesizer.RawChunk(source_path=rel, chunk_index=0, text=f"[{path.name} — preview unavailable without an LLM configured]")]
        for chunk in chunks:
            passages.extend(_split_raw_chunk_into_passages(chunk))
    return passages


def sync_corpus_to_vector_store(corpus: list[Passage], llm: LLMClient, store: VectorStore) -> int:
    """Embed and upsert every passage not already present in `store`,
    keyed by rag_types.passage_id(). Existing entries are never re-embedded —
    that's the entire point of a persistent store versus re-embedding the
    whole corpus on every retrieve_hybrid() call. Returns how many new
    embeddings were actually computed (0 on a second call against an
    unchanged corpus).
    """
    docs, _ = index_corpus(corpus)
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
    docs, _ = index_corpus(corpus)
    live_ids = {d.id for d in docs}
    stale_ids = [record.id for record in store.all_records() if record.id not in live_ids]
    for stale_id in stale_ids:
        store.delete(stale_id)
    return len(stale_ids)


def retrieve(query: str, corpus: list[Passage], *, top_k: int = 5) -> list[ScoredPassage]:
    """BM25 ranking over the corpus — always available, no API key needed.
    See documentation/25-hybrid-retrieval.md for how this compares to the
    original ad hoc TF-IDF-style scorer it replaced."""
    docs, by_id = index_corpus(corpus)
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
    enable_embeddings: bool = True,
    bm25_config: hybrid_retrieval.BM25Config = hybrid_retrieval.DEFAULT_BM25_CONFIG,
) -> list[ScoredPassage]:
    """BM25, optionally fused with embedding similarity (reciprocal rank
    fusion) and reranked by the LLM, when one is configured. Degrades one
    tier at a time — hybrid+rerank -> hybrid -> BM25-only — on any failure,
    so this is always safe to call regardless of API availability.

    enable_embeddings=False (the RAG Architecture page's "BM25 only" mode,
    see rag_settings.py) skips the embedding/fusion tier entirely and
    returns straight BM25 ranking, same as retrieve() but still eligible
    for the rerank tier below. bm25_config carries the k1/b tuning from
    that same settings page through to hybrid_retrieval.bm25_rank().

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
    docs, by_id = index_corpus(corpus)
    shortlist_k = max(top_k * 3, top_k)

    bm25_top = hybrid_retrieval.bm25_rank(query, docs, top_k=shortlist_k, config=bm25_config)
    client = llm or LLMClient()
    if not client.available:
        return [ScoredPassage(by_id[r.doc_id], r.score) for r in bm25_top[:top_k]]

    fused = bm25_top
    if enable_embeddings:
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


def _extractive_answer(scored: list[ScoredPassage], source: str = "wiki") -> str:
    lines = [f"No LLM is configured, so here are the closest matches from the {_corpus_label(source)}:"]
    for item in scored[:3]:
        passage = item.passage
        snippet = passage.text if len(passage.text) <= 400 else f"{passage.text[:400]}…"
        lines.append(f"\n**{passage.title} — {passage.heading}**\n{snippet}")
    return "\n".join(lines)


def _faithfulness_signal(mode: str, answer: str, scored: list[ScoredPassage]) -> dict[str, Any] | None:
    """A best-effort groundedness signal for the chat UI (rendered as a small
    badge — see documentation/28-faithfulness-evaluation.md). Extractive
    answers are faithful by construction (the text is quoted verbatim from
    the retrieved passages), so no scoring is needed. Generated answers get
    faithfulness_heuristic's offline lexical-overlap proxy against the same
    passages the model was actually given — never an LLM judge, and never
    blocking (a heuristic-only signal, with the false-positive-on-paraphrase
    caveat that module documents)."""
    if mode == "extractive":
        return {"basis": "extractive", "unsupported_rate": 0.0, "checkable_count": 0}
    if mode != "generated":
        return None
    sources_text = "\n\n".join(item.passage.text for item in scored)
    report = score_text_against_sources(answer, sources_text)
    if report.checkable_count == 0:
        return None
    return {
        "basis": "heuristic",
        "unsupported_rate": round(report.unsupported_rate, 4),
        "checkable_count": report.checkable_count,
    }


def _build_prompt(query: str, scored: list[ScoredPassage], history: list[dict[str, str]] | None, source: str = "wiki") -> str:
    context = _format_context(scored)
    history_block = ""
    if history:
        turns = "\n".join(f"{turn.get('role', 'user')}: {turn.get('content', '')}" for turn in history[-6:])
        history_block = f"Conversation so far:\n{turns}\n\n"
    label = "Wiki excerpts" if source != "raw" else "Source excerpts"
    return f"{history_block}{label}:\n{context}\n\nQuestion: {query}"


def _retrieve(
    query: str,
    *,
    docs_dir: Path | None,
    llm: LLMClient | None,
    top_k: int | None,
    doc_scope: list[str] | None,
    source: str = "wiki",
) -> dict[str, Any]:
    """Shared corpus-build + retrieve + dedupe-sources step used by both
    answer_question() and answer_question_stream(). Returns either
    {"early": {...}} (the empty/no_match response, ready to return as-is)
    or {"scored": [...], "sources": [...], "client": LLMClient, "settings": RagSettings}.

    top_k=None (the default for every caller except the retrieval eval
    scripts) picks up the RAG Architecture page's saved top_k instead of a
    hardcoded value -- see rag_settings.py.

    source picks which corpus is searched: "wiki" (default) is
    build_corpus()'s compiled wiki pages; "raw" is build_raw_corpus()'s
    uncompiled data/raw/ inputs -- the chat's two modes. docs_dir only
    applies to "wiki" (it's meaningless for the raw corpus, which is always
    RAW_DIR).
    """
    query = (query or "").strip()
    is_raw = source == "raw"
    if is_raw:
        corpus = _filter_corpus(build_raw_corpus(), doc_scope)
    else:
        docs_dir = docs_dir or OUTPUT_DIR
        corpus = _filter_corpus(build_corpus(docs_dir), doc_scope)
    settings = rag_settings.load_rag_settings()

    if not query:
        return {"early": {"answer": f"Ask a question about anything in the {_corpus_label(source)}.", "sources": [], "mode": "empty"}}

    if not corpus:
        empty_answer = (
            "No raw source files were found under data/raw/, so there's nothing to search. "
            "Add some files first, then ask again."
            if is_raw
            else "The wiki hasn't been compiled yet, so there's nothing to search. Run the compiler pipeline first, then ask again."
        )
        return {"early": {"answer": empty_answer, "sources": [], "mode": "empty"}}

    # "chat" is its own LLM purpose (backend/src/lib/llmSettings.ts), kept
    # independent of the pipeline's "default" so the wiki UI's Chat page can
    # point retrieval + answer generation at the local model or a different
    # cloud API without touching pipeline runs.
    client = llm or LLMClient.for_purpose("chat")
    effective_top_k = top_k if top_k is not None else settings.top_k
    bm25_config = hybrid_retrieval.BM25Config(k1=settings.bm25_k1, b=settings.bm25_b)

    if settings.architecture == "hybrid":
        vector_store = VectorStore(VECTOR_STORE_FILE) if settings.use_vector_store else None
        scored = retrieve_hybrid(
            query,
            corpus,
            top_k=effective_top_k,
            llm=client,
            rerank=settings.enable_rerank,
            enable_embeddings=settings.enable_embeddings,
            bm25_config=bm25_config,
            vector_store=vector_store,
        )
    else:
        # One of rag_architectures.ARCHITECTURES (naive/HyDE/RAG-Fusion/
        # GraphRAG-lite/CRAG-lite) -- see documentation/38-rag-architectures.md.
        # retrieval_mode/use_vector_store don't apply to these; each manages
        # its own use of the LLM (or degrades to BM25 without one).
        scored = rag_architectures.retrieve(
            settings.architecture,
            query,
            corpus,
            top_k=effective_top_k,
            llm=client,
            bm25_config=bm25_config,
        )
    if not scored:
        no_match_answer = (
            "I couldn't find anything in the raw sources about that. Try rephrasing, or add "
            "the relevant file under data/raw/."
            if is_raw
            else "I couldn't find anything in the wiki about that. Try rephrasing, or make sure the relevant source has been compiled."
        )
        return {"early": {"answer": no_match_answer, "sources": [], "mode": "no_match"}}

    return {"scored": scored, "sources": _deduped_sources(scored), "client": client, "settings": settings}


def answer_question(
    query: str,
    *,
    history: list[dict[str, str]] | None = None,
    docs_dir: Path | None = None,
    llm: LLMClient | None = None,
    top_k: int | None = None,
    doc_scope: list[str] | None = None,
    source: str = "wiki",
) -> dict[str, Any]:
    """Answer a question over the compiled wiki, or (source="raw") the raw,
    uncompiled data/raw/ inputs it was built from -- see build_raw_corpus().

    doc_scope, when given, restricts retrieval to passages from those
    doc_paths (e.g. a chat session scoped to a subset of resources). Only
    meaningful for source="wiki" -- resource scoping is wiki-doc-path based,
    so callers should pass doc_scope=None for the raw-sources mode.

    Returns {"answer", "sources", "mode", "faithfulness"} where mode is one of:
    - "empty": nothing has been compiled yet
    - "no_match": the corpus has nothing relevant to the query
    - "generated": an LLM wrote the answer from retrieved context
    - "extractive": no LLM configured (or the call failed), or the RAG
      Architecture page's answer mode is pinned to "extractive" — the
      retrieved passages are returned directly as the answer

    "faithfulness" is omitted for "empty"/"no_match" (no real answer to
    score); see _faithfulness_signal() for its shape otherwise.
    """
    retrieval = _retrieve(query, docs_dir=docs_dir, llm=llm, top_k=top_k, doc_scope=doc_scope, source=source)
    if "early" in retrieval:
        return retrieval["early"]

    scored, sources, client = retrieval["scored"], retrieval["sources"], retrieval["client"]
    force_extractive = retrieval["settings"].answer_mode == "extractive"

    if client.available and not force_extractive:
        prompt = _build_prompt(query.strip(), scored, history, source)
        try:
            answer = client.generate_response(prompt, _system_prompt(source), temperature=0.1).strip()
            return {
                "answer": answer,
                "sources": sources,
                "mode": "generated",
                "faithfulness": _faithfulness_signal("generated", answer, scored),
            }
        except RuntimeError:
            pass  # fall through to the extractive answer below

    extractive_answer = _extractive_answer(scored, source)
    return {
        "answer": extractive_answer,
        "sources": sources,
        "mode": "extractive",
        "faithfulness": _faithfulness_signal("extractive", extractive_answer, scored),
    }


def answer_question_stream(
    query: str,
    *,
    history: list[dict[str, str]] | None = None,
    docs_dir: Path | None = None,
    llm: LLMClient | None = None,
    top_k: int | None = None,
    doc_scope: list[str] | None = None,
    source: str = "wiki",
) -> Iterator[dict[str, Any]]:
    """Streaming counterpart to answer_question(). Yields event dicts:
    {"type": "sources", "sources": [...]} once retrieval finishes, then one
    or more {"type": "delta", "text": "..."} chunks as the answer is
    generated (or a single chunk carrying the extractive fallback when no
    LLM is configured), then a final
    {"type": "done", "mode", "answer", "faithfulness"} — see
    _faithfulness_signal() for that field's shape.
    """
    retrieval = _retrieve(query, docs_dir=docs_dir, llm=llm, top_k=top_k, doc_scope=doc_scope, source=source)
    if "early" in retrieval:
        early = retrieval["early"]
        yield {"type": "sources", "sources": early["sources"]}
        yield {"type": "done", "mode": early["mode"], "answer": early["answer"]}
        return

    scored, sources, client = retrieval["scored"], retrieval["sources"], retrieval["client"]
    force_extractive = retrieval["settings"].answer_mode == "extractive"
    yield {"type": "sources", "sources": sources}

    if client.available and not force_extractive:
        prompt = _build_prompt(query.strip(), scored, history, source)
        try:
            full_text = ""
            for delta in client.stream_response(prompt, _system_prompt(source), temperature=0.1):
                full_text += delta
                yield {"type": "delta", "text": delta}
            full_text = full_text.strip()
            yield {
                "type": "done",
                "mode": "generated",
                "answer": full_text,
                "faithfulness": _faithfulness_signal("generated", full_text, scored),
            }
            return
        except RuntimeError:
            pass  # fall through to the extractive answer below

    extractive = _extractive_answer(scored, source)
    yield {"type": "delta", "text": extractive}
    yield {
        "type": "done",
        "mode": "extractive",
        "answer": extractive,
        "faithfulness": _faithfulness_signal("extractive", extractive, scored),
    }

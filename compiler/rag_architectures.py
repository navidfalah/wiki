"""Alternative RAG *architectures* — distinct retrieval strategies a person
can pick on the RAG Architecture settings page, each implementing a
different published approach to retrieval-augmented generation rather than
just a tuning knob on one approach. `hybrid_retrieval.py` + `rag_engine.
retrieve_hybrid()` already covers the "hybrid retrieve-and-rerank" family
(BM25 -> embedding fusion -> LLM rerank, see documentation/25-hybrid-
retrieval.md); this module adds the other shapes RAG commonly takes:

- **Naive RAG** (`retrieve_naive`) — the original retrieve-then-read
  pipeline (Lewis et al., 2020): embed/rank once, stuff the top-k into the
  prompt. Here that's a single BM25 pass, i.e. `rag_engine.retrieve()`
  reimplemented standalone so this module doesn't import rag_engine (see
  "Why this module doesn't import rag_engine" below). Baseline every other
  architecture is compared against.
- **HyDE — Hypothetical Document Embeddings** (`retrieve_hyde`, Gao et al.,
  2022) — ask the LLM to hallucinate a plausible answer passage *before*
  retrieving, then embed that hypothetical passage instead of the raw query
  and rank the corpus against it. The premise: a fake answer sits closer in
  embedding space to real answers than a short, often underspecified
  question does. Fused with plain BM25 via reciprocal rank fusion so a
  badly-hallucinated hypothetical can't tank recall on its own.
- **RAG-Fusion** (`retrieve_fusion`, Rackauckas, 2024) — ask the LLM to
  generate several alternative phrasings of the question, retrieve for each
  phrasing independently, and fuse all the rankings with reciprocal rank
  fusion. Where HyDE diversifies the *retrieval representation*, RAG-Fusion
  diversifies the *query itself* — different wordings surface different
  passages that a single phrasing's keyword or embedding overlap would
  miss.
- **GraphRAG-lite / link-expansion** (`retrieve_graph`, in the spirit of
  Microsoft's GraphRAG, 2024, scaled to what this repo already has) — this
  wiki is *already* a knowledge graph: linker.py cross-links every
  synthesized page to the others it mentions. This architecture retrieves
  seed passages by BM25 as usual, then walks those pages' own markdown
  links outward (configurable hop count) to pull in passages from linked
  pages that the flat keyword/embedding ranking wouldn't have surfaced on
  its own — e.g. a question about a product surfaces its spec page even
  when the query terms only appear on a linked incident report. Needs no
  LLM or embeddings at all, so it stays in the same "zero-setup" tier as
  BM25.
- **Corrective RAG / CRAG-lite** (`retrieve_corrective`, Yan et al., 2024) —
  grade the first retrieval pass's relevance (an LLM classifier when one is
  configured, a keyword-coverage heuristic otherwise) and, when it isn't
  confidently relevant, take a corrective action: rewrite the query (via
  the LLM, or fall back to the same query) and retry with a wider net,
  fusing both passes. The original CRAG also has a live web-search
  fallback for a completely failed retrieval; there's no external search
  here, so the "correction" is entirely query refinement + a second pass
  over the same corpus.

Every architecture takes the same `(query, corpus, *, top_k, llm,
bm25_config)` shape and returns `list[rag_types.ScoredPassage]`, so
rag_engine.py's `_retrieve()` can dispatch to any of them (or to its own
`retrieve_hybrid()` for the "hybrid" architecture) without the rest of the
chat pipeline — prompt building, extractive fallback, streaming — caring
which one ran. Every architecture also degrades to plain BM25 when no LLM
is configured (or a call fails), matching the rest of the repo's "chat
still works with zero API setup" property.

Why this module doesn't import rag_engine: rag_engine.py needs to dispatch
*to* these architectures by name, so the dependency can only run one
way — this module depends on rag_types.py (the shared Passage/ScoredPassage
types) and hybrid_retrieval.py (the ranking primitives), never on
rag_engine.py itself.
"""

from __future__ import annotations

import json
import re
from collections.abc import Callable

import hybrid_retrieval
from llm_client import LLMClient
from rag_types import Passage, ScoredPassage, index_corpus

# --- Naive RAG ---------------------------------------------------------------


def retrieve_naive(
    query: str,
    corpus: list[Passage],
    *,
    top_k: int = 5,
    llm: LLMClient | None = None,
    bm25_config: hybrid_retrieval.BM25Config = hybrid_retrieval.DEFAULT_BM25_CONFIG,
) -> list[ScoredPassage]:
    """The textbook retrieve-then-read baseline: a single BM25 pass, no
    query rewriting, no fusion, no reranking. `llm` is accepted (and
    ignored) only so every architecture shares one call signature."""
    docs, by_id = index_corpus(corpus)
    ranked = hybrid_retrieval.bm25_rank(query, docs, top_k=top_k, config=bm25_config)
    return [ScoredPassage(by_id[r.doc_id], r.score) for r in ranked]


# --- HyDE: Hypothetical Document Embeddings ----------------------------------

HYDE_SYSTEM_PROMPT = (
    "Write a short, plausible passage (3-5 sentences) that would appear in a "
    "wiki page directly answering the question below. Invent specifics if "
    "you don't know them -- this text is only used to find semantically "
    "similar real passages, it is never shown to the user."
)


def retrieve_hyde(
    query: str,
    corpus: list[Passage],
    *,
    top_k: int = 5,
    llm: LLMClient | None = None,
    bm25_config: hybrid_retrieval.BM25Config = hybrid_retrieval.DEFAULT_BM25_CONFIG,
) -> list[ScoredPassage]:
    """Embed an LLM-hallucinated hypothetical answer instead of the raw
    query, rank the corpus against that embedding, and fuse the result with
    plain BM25 (reciprocal rank fusion) so a poor hypothetical can't erase
    keyword-obvious matches. Falls back to BM25-only when no LLM is
    configured or either call fails."""
    docs, by_id = index_corpus(corpus)
    shortlist_k = max(top_k * 3, top_k)
    bm25_top = hybrid_retrieval.bm25_rank(query, docs, top_k=shortlist_k, config=bm25_config)

    client = llm or LLMClient()
    if not client.available:
        return [ScoredPassage(by_id[r.doc_id], r.score) for r in bm25_top[:top_k]]

    try:
        hypothetical = client.generate_response(query, HYDE_SYSTEM_PROMPT, temperature=0.3)
        embedding_top = hybrid_retrieval.embedding_rank(hypothetical, docs, client.embed_text, top_k=shortlist_k)
        fused = hybrid_retrieval.reciprocal_rank_fusion([bm25_top, embedding_top], top_k=top_k)
    except RuntimeError:
        return [ScoredPassage(by_id[r.doc_id], r.score) for r in bm25_top[:top_k]]

    if not fused:
        return [ScoredPassage(by_id[r.doc_id], r.score) for r in bm25_top[:top_k]]
    return [ScoredPassage(by_id[r.doc_id], r.score) for r in fused if r.doc_id in by_id]


# --- RAG-Fusion: multi-query retrieval + RRF --------------------------------

FUSION_SYSTEM_PROMPT = (
    "Generate 3 alternative phrasings of the user's question that search "
    "the same underlying information need from different angles (a synonym "
    "swap, a more specific version, a more general version). Return ONLY a "
    "JSON array of exactly 3 strings, no commentary.\n\n"
    'Example response: ["...", "...", "..."]'
)


def _parse_query_variants(raw: str) -> list[str]:
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        return []
    try:
        parsed = json.loads(match.group())
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    return [v.strip() for v in parsed if isinstance(v, str) and v.strip()]


def retrieve_fusion(
    query: str,
    corpus: list[Passage],
    *,
    top_k: int = 5,
    llm: LLMClient | None = None,
    bm25_config: hybrid_retrieval.BM25Config = hybrid_retrieval.DEFAULT_BM25_CONFIG,
    num_variants: int = 3,
) -> list[ScoredPassage]:
    """Ask the LLM for `num_variants` alternative phrasings of the query,
    BM25-rank the corpus against every phrasing (the original included), and
    fuse all the rankings with reciprocal rank fusion. A malformed or
    missing LLM response just means zero variants -- this degrades to plain
    BM25 on the original query, never an error."""
    docs, by_id = index_corpus(corpus)
    shortlist_k = max(top_k * 3, top_k)
    base_ranking = hybrid_retrieval.bm25_rank(query, docs, top_k=shortlist_k, config=bm25_config)

    client = llm or LLMClient()
    variants: list[str] = []
    if client.available:
        try:
            raw = client.generate_response(query, FUSION_SYSTEM_PROMPT, temperature=0.5)
            variants = _parse_query_variants(raw)[:num_variants]
        except RuntimeError:
            variants = []

    if not variants:
        return [ScoredPassage(by_id[r.doc_id], r.score) for r in base_ranking[:top_k]]

    rankings = [base_ranking] + [
        hybrid_retrieval.bm25_rank(variant, docs, top_k=shortlist_k, config=bm25_config) for variant in variants
    ]
    fused = hybrid_retrieval.reciprocal_rank_fusion(rankings, top_k=top_k)
    if not fused:
        return [ScoredPassage(by_id[r.doc_id], r.score) for r in base_ranking[:top_k]]
    return [ScoredPassage(by_id[r.doc_id], r.score) for r in fused if r.doc_id in by_id]


# --- GraphRAG-lite: link-expansion over the wiki's own cross-links ----------

# Matches this repo's own cross-link syntax, e.g. "[Nova Widget](./nova-widget.md)"
# or "[Nova Widget](nova-widget.md)" -- see linker.py, which is what writes them.
_LINK_RE = re.compile(r"\]\(\.?/?([a-z0-9][a-z0-9-]*)\.md\)")


def _build_link_graph(corpus: list[Passage]) -> dict[str, set[str]]:
    """doc_path -> set of doc_paths it links to, read straight off the
    already-compiled passage text -- no separate link index needed, since
    linker.py's cross-links are already sitting in the corpus."""
    graph: dict[str, set[str]] = {}
    for passage in corpus:
        targets = {f"{slug}.md" for slug in _LINK_RE.findall(passage.text)}
        targets.discard(passage.doc_path)
        graph.setdefault(passage.doc_path, set()).update(targets)
    return graph


def retrieve_graph(
    query: str,
    corpus: list[Passage],
    *,
    top_k: int = 5,
    llm: LLMClient | None = None,
    bm25_config: hybrid_retrieval.BM25Config = hybrid_retrieval.DEFAULT_BM25_CONFIG,
    hops: int = 1,
) -> list[ScoredPassage]:
    """BM25-rank the corpus, then follow the seed pages' own markdown
    cross-links outward (`hops` levels) to pull in one supporting passage
    per newly-reached page -- the same "click through to the linked page"
    a person would do when a wiki answer references something else. Each
    hop's contribution is scaled down by 0.5 per level so a directly
    relevant passage is never outranked by a tangentially-linked one.
    Needs no LLM or embeddings; `llm` is accepted only for call-signature
    parity with the other architectures."""
    docs, by_id = index_corpus(corpus)
    if not docs:
        return []

    graph = _build_link_graph(corpus)
    # Each page's first passage in corpus order stands in for "the page" when
    # it's reached by expansion rather than direct BM25 relevance -- there's
    # no query-relevance signal to pick among a linked page's own passages
    # with, since the whole point of expanding to it is that it *didn't*
    # match the query.
    representative_id_by_page: dict[str, str] = {}
    for doc_id, passage in by_id.items():
        representative_id_by_page.setdefault(passage.doc_path, doc_id)

    full_ranking = hybrid_retrieval.bm25_rank(query, docs, top_k=len(docs), config=bm25_config)
    if not full_ranking:
        return []

    seeds = full_ranking[: max(top_k, 1)]
    combined: dict[str, float] = {r.doc_id: r.score for r in seeds}
    page_score: dict[str, float] = {}
    for r in seeds:
        page = by_id[r.doc_id].doc_path
        page_score[page] = max(page_score.get(page, 0.0), r.score)

    reached_pages = set(page_score)
    frontier = set(reached_pages)
    decay = 0.5

    for _ in range(max(hops, 0)):
        neighbor_pages = {n for page in frontier for n in graph.get(page, set())} - reached_pages
        if not neighbor_pages:
            break
        next_page_score: dict[str, float] = {}
        for page in neighbor_pages:
            # Propagate the score from whichever frontier page(s) link to
            # it, decayed -- a neighbor's own (possibly zero) BM25 relevance
            # to the original query is irrelevant here; it's included
            # *because* a relevant page links to it, not because it matches.
            inbound_scores = [page_score[src] for src in frontier if page in graph.get(src, set())]
            if not inbound_scores:
                continue
            score = max(inbound_scores) * decay
            next_page_score[page] = score
            representative_id = representative_id_by_page.get(page)
            if representative_id is not None:
                combined[representative_id] = max(combined.get(representative_id, 0.0), score)
        reached_pages |= neighbor_pages
        page_score.update(next_page_score)
        frontier = neighbor_pages
        decay *= 0.5

    ordered = sorted(combined.items(), key=lambda kv: kv[1], reverse=True)[:top_k]
    return [ScoredPassage(by_id[doc_id], score) for doc_id, score in ordered]


# --- Corrective RAG (CRAG-lite) ----------------------------------------------

CORRECTIVE_GRADE_SYSTEM_PROMPT = (
    "You grade whether retrieved passages actually answer a question. Given "
    "the question and the passages, respond with exactly one word: CORRECT "
    "(the passages clearly answer it), AMBIGUOUS (partially relevant), or "
    "INCORRECT (not relevant)."
)
CORRECTIVE_REWRITE_SYSTEM_PROMPT = (
    "The first search for this question didn't find a clearly relevant "
    "result. Rewrite the question as a broader or differently-worded search "
    "query likely to match more of the source material. Return ONLY the "
    "rewritten query, no commentary."
)


def _grade_relevance_heuristic(query_terms: list[str], top: ScoredPassage | None) -> str:
    """Grading fallback for when no LLM is configured: how much of the
    query's vocabulary the top passage actually contains. Coarser than an
    LLM judgment, but same three-way outcome, so retrieve_corrective()
    doesn't need two code paths downstream of grading."""
    if top is None or not query_terms:
        return "INCORRECT"
    unique_terms = set(query_terms)
    covered = sum(1 for term in unique_terms if term in top.passage.tokens)
    ratio = covered / len(unique_terms)
    if ratio >= 0.6:
        return "CORRECT"
    if ratio > 0:
        return "AMBIGUOUS"
    return "INCORRECT"


def retrieve_corrective(
    query: str,
    corpus: list[Passage],
    *,
    top_k: int = 5,
    llm: LLMClient | None = None,
    bm25_config: hybrid_retrieval.BM25Config = hybrid_retrieval.DEFAULT_BM25_CONFIG,
) -> list[ScoredPassage]:
    """Retrieve, grade the result's relevance, and if it isn't confidently
    relevant, rewrite the query and retry with a wider net, fusing both
    passes. Grading uses the LLM when one is configured (a single
    CORRECT/AMBIGUOUS/INCORRECT classification call), and a keyword-coverage
    heuristic otherwise -- so the corrective loop itself runs even with zero
    API setup, just with a cruder judge. Unlike the original CRAG paper,
    there's no live web search fallback here: the "correction" is query
    refinement plus a second pass over the same corpus."""
    docs, by_id = index_corpus(corpus)
    first_pass = hybrid_retrieval.bm25_rank(query, docs, top_k=max(top_k, 1), config=bm25_config)
    scored = [ScoredPassage(by_id[r.doc_id], r.score) for r in first_pass]

    client = llm or LLMClient()
    grade: str | None = None
    if client.available and scored:
        try:
            context = "\n\n".join(item.passage.text for item in scored[:3])
            raw = client.generate_response(
                f"Question: {query}\n\nPassages:\n{context}", CORRECTIVE_GRADE_SYSTEM_PROMPT, temperature=0.0
            )
            first_word = raw.strip().upper().split()[0].strip(".,:") if raw.strip() else ""
            if first_word in ("CORRECT", "AMBIGUOUS", "INCORRECT"):
                grade = first_word
        except RuntimeError:
            grade = None

    if grade is None:
        grade = _grade_relevance_heuristic(hybrid_retrieval.tokenize(query), scored[0] if scored else None)

    if grade == "CORRECT":
        return scored[:top_k]

    retry_query = query
    if client.available:
        try:
            rewritten = client.generate_response(query, CORRECTIVE_REWRITE_SYSTEM_PROMPT, temperature=0.3).strip()
            if rewritten:
                retry_query = rewritten
        except RuntimeError:
            pass

    second_pass = hybrid_retrieval.bm25_rank(retry_query, docs, top_k=max(top_k * 2, top_k), config=bm25_config)
    merged = hybrid_retrieval.reciprocal_rank_fusion([first_pass, second_pass], top_k=top_k)
    if not merged:
        return scored[:top_k]
    return [ScoredPassage(by_id[r.doc_id], r.score) for r in merged if r.doc_id in by_id]


# --- Dispatch -----------------------------------------------------------------

RetrieveFn = Callable[..., list[ScoredPassage]]

# "hybrid" is deliberately absent: that's rag_engine.retrieve_hybrid()'s
# three-tier stack, which this module builds on but doesn't reimplement --
# see the module docstring's "Why this module doesn't import rag_engine".
ARCHITECTURES: dict[str, RetrieveFn] = {
    "naive": retrieve_naive,
    "hyde": retrieve_hyde,
    "fusion": retrieve_fusion,
    "graph": retrieve_graph,
    "corrective": retrieve_corrective,
}


def retrieve(
    architecture: str,
    query: str,
    corpus: list[Passage],
    *,
    top_k: int = 5,
    llm: LLMClient | None = None,
    bm25_config: hybrid_retrieval.BM25Config = hybrid_retrieval.DEFAULT_BM25_CONFIG,
) -> list[ScoredPassage]:
    """Dispatch to one of ARCHITECTURES by name. Raises ValueError for an
    unknown name (including "hybrid") -- callers that support the hybrid
    family should call rag_engine.retrieve_hybrid() directly instead."""
    fn = ARCHITECTURES.get(architecture)
    if fn is None:
        raise ValueError(f"Unknown RAG architecture: {architecture!r}")
    return fn(query, corpus, top_k=top_k, llm=llm, bm25_config=bm25_config)

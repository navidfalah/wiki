"""Generic hybrid retrieval primitives: BM25, embedding-based cosine
ranking, reciprocal rank fusion, and an LLM-based reranker.

Deliberately generic over a minimal `Doc` (id/text/tokens) rather than
rag_engine.py's wiki-specific `Passage`, so the exact same functions back
both the live wiki chat corpus (rag_engine.py wraps these) and the
retrieval eval dataset (retrieval_eval_dataset.py / retrieval_eval.py),
which is what lets the eval script measure these primitives directly
instead of measuring rag_engine's wiring around them.

Three tiers, each independently optional so retrieval degrades gracefully
without an LLM/embeddings API, same "zero-setup chat" property rag_engine.py
already had before this module existed:

1. bm25_rank — Okapi BM25 (stdlib only). Always available. Replaces the
   original ad hoc TF-IDF-style scorer rag_engine.py shipped with; see
   documentation/25-hybrid-retrieval.md for the head-to-head comparison.
2. embedding_rank — cosine similarity over an embed_fn's vectors (in
   practice LLMClient.embed_text, an OpenAI-compatible embeddings call).
   reciprocal_rank_fusion combines it with bm25_rank's ranking.
3. llm_rerank — a chat-model call that reorders a shortlist of candidates
   by relevance. The last, most expensive, most accurate tier.
"""

from __future__ import annotations

import json
import math
import re
from collections.abc import Callable
from dataclasses import dataclass

_WORD_RE = re.compile(r"[a-z0-9]+")

EmbedFn = Callable[[str], list[float]]


def tokenize(text: str) -> list[str]:
    return _WORD_RE.findall(text.lower())


@dataclass(frozen=True)
class Doc:
    id: str
    text: str
    tokens: list[str]


@dataclass(frozen=True)
class RankedDoc:
    doc_id: str
    score: float


# --- Tier 1: BM25 -----------------------------------------------------------


@dataclass(frozen=True)
class BM25Config:
    k1: float = 1.5
    b: float = 0.75


DEFAULT_BM25_CONFIG = BM25Config()


def bm25_rank(
    query: str,
    documents: list[Doc],
    *,
    top_k: int = 5,
    config: BM25Config = DEFAULT_BM25_CONFIG,
) -> list[RankedDoc]:
    """Okapi BM25 ranking. Standard formula: idf can go negative for terms
    that appear in more than half the corpus — that's expected BM25
    behavior (such a term actively argues against relevance), not a bug."""
    query_terms = tokenize(query)
    if not query_terms or not documents:
        return []

    doc_lengths = {doc.id: len(doc.tokens) for doc in documents}
    nonzero_docs = [doc for doc in documents if doc_lengths[doc.id]]
    avgdl = sum(doc_lengths.values()) / len(nonzero_docs) if nonzero_docs else 0.0

    df: dict[str, int] = {}
    for doc in documents:
        for term in set(doc.tokens):
            df[term] = df.get(term, 0) + 1
    n = len(documents)

    scores: dict[str, float] = {}
    for doc in documents:
        if not doc.tokens:
            continue
        term_counts: dict[str, int] = {}
        for token in doc.tokens:
            term_counts[token] = term_counts.get(token, 0) + 1

        score = 0.0
        for term in query_terms:
            tf = term_counts.get(term, 0)
            if tf == 0:
                continue
            term_df = df.get(term, 0)
            idf = math.log(1 + (n - term_df + 0.5) / (term_df + 0.5))
            denom = tf + config.k1 * (1 - config.b + config.b * doc_lengths[doc.id] / avgdl)
            score += idf * (tf * (config.k1 + 1)) / denom

        if score > 0:
            scores[doc.id] = score

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:top_k]
    return [RankedDoc(doc_id, score) for doc_id, score in ranked]


# --- Tier 2: embeddings + fusion --------------------------------------------


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


def embed_documents(documents: list[Doc], embed_fn: EmbedFn) -> dict[str, list[float]]:
    return {doc.id: embed_fn(doc.text) for doc in documents}


def embedding_rank(
    query: str,
    documents: list[Doc],
    embed_fn: EmbedFn,
    *,
    top_k: int = 5,
    doc_embeddings: dict[str, list[float]] | None = None,
) -> list[RankedDoc]:
    if not documents:
        return []
    embeddings = doc_embeddings if doc_embeddings is not None else embed_documents(documents, embed_fn)
    query_vec = embed_fn(query)

    scored = [RankedDoc(doc.id, cosine_similarity(query_vec, embeddings.get(doc.id, []))) for doc in documents]
    scored = [item for item in scored if item.score > 0]
    scored.sort(key=lambda item: item.score, reverse=True)
    return scored[:top_k]


def reciprocal_rank_fusion(
    rankings: list[list[RankedDoc]],
    *,
    k: int = 60,
    top_k: int = 5,
) -> list[RankedDoc]:
    """Standard RRF: score(d) = sum over rankings of 1/(k + rank_in_that_list).
    Fuses ranked lists that may use incomparable score scales (BM25 scores
    and cosine similarities aren't on the same axis) without needing to
    normalize either one — RRF only looks at rank position."""
    fused: dict[str, float] = {}
    for ranking in rankings:
        for rank, item in enumerate(ranking, start=1):
            fused[item.doc_id] = fused.get(item.doc_id, 0.0) + 1.0 / (k + rank)

    ordered = sorted(fused.items(), key=lambda kv: kv[1], reverse=True)[:top_k]
    return [RankedDoc(doc_id, score) for doc_id, score in ordered]


# --- Tier 3: LLM rerank ------------------------------------------------------

RERANK_SYSTEM_PROMPT = """You are a search relevance reranker.

Given a query and a numbered list of candidate passages, return ONLY a JSON
array of the passage numbers ordered from most to least relevant to the
query. Include every number exactly once, no commentary.

Example response: [3, 1, 2]"""


def _parse_rerank_order(raw: str, n: int) -> list[int]:
    """Falls back to the original 1..n order on any parse failure — a
    reranker that can't be trusted this round should not reorder anything,
    not guess."""
    fallback = list(range(1, n + 1))
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if not match:
        return fallback
    try:
        order = json.loads(match.group())
    except json.JSONDecodeError:
        return fallback
    if not isinstance(order, list):
        return fallback

    valid = [i for i in order if isinstance(i, int) and 1 <= i <= n]
    deduped = list(dict.fromkeys(valid))
    missing = [i for i in range(1, n + 1) if i not in deduped]
    return deduped + missing


def llm_rerank(
    query: str,
    candidates: list[Doc],
    llm,
    *,
    top_n: int | None = None,
) -> list[RankedDoc]:
    """Reorder candidates by an LLM's relevance judgment. Assigns a
    synthetic descending score (n, n-1, ..., 1) so the result is a
    drop-in RankedDoc list like the other two tiers."""
    if not candidates:
        return []

    numbered = "\n\n".join(f"[{i + 1}] {doc.text}" for i, doc in enumerate(candidates))
    prompt = f"Query: {query}\n\nCandidates:\n{numbered}"
    raw = llm.generate_response(prompt, RERANK_SYSTEM_PROMPT, temperature=0.0)
    order = _parse_rerank_order(raw, len(candidates))

    reordered = [candidates[i - 1] for i in order]
    if top_n is not None:
        reordered = reordered[:top_n]

    total = len(reordered)
    return [RankedDoc(doc.id, float(total - rank)) for rank, doc in enumerate(reordered)]

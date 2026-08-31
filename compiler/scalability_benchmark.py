"""Scalability benchmark: BM25 vs. a persistent vector store, across
corpus sizes — the direct follow-up task #5 named as open:
[25-hybrid-retrieval.md](../documentation/25-hybrid-retrieval.md) found
"no clear win" for BM25 over the original TF-IDF scorer at 24 passages,
and explicitly flagged corpus scale as the untested variable. This
measures the actually-different question: does a persistent vector store
(vector_store.py) behave differently from BM25's from-scratch-every-call
indexing (hybrid_retrieval.bm25_rank, as rag_engine.py runs it today) as
corpus size grows.

Deliberately measuring INFRASTRUCTURE cost (ingestion throughput, query
latency), not retrieval QUALITY — this environment has no OPENAI_API_KEY,
so there's no real embedding model to measure quality with. Query vectors
here are seeded-random, fixed-dimension floats: a legitimate way to
benchmark a vector store's raw indexing/search performance independent of
any particular embedding model, but not a substitute for a real recall/
nDCG-at-scale measurement, which is named as a follow-up requiring API
access, same as tasks #4/#5/#8's live-model gaps.

The synthetic corpus itself is built by replicating and perturbing the
real, grounded passages from retrieval_eval_dataset.py — clearly labeled
synthetic scaling data, not a claim that a 10,000-document personal wiki
would contain this exact content.
"""

from __future__ import annotations

import random
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path

import hybrid_retrieval
from retrieval_eval_dataset import build_passage_docs
from vector_store import VectorRecord, VectorStore

EMBEDDING_DIM = 128


def generate_synthetic_corpus(target_size: int, *, seed: int = 0) -> list[hybrid_retrieval.Doc]:
    """Scale retrieval_eval_dataset.py's ~24 real passages up to
    target_size by replicating them with a numeric suffix appended to each
    copy's text (so BM25's term statistics still vary slightly per
    "document" rather than every copy being byte-identical, which would
    make indexing artificially trivial)."""
    base_docs = build_passage_docs()
    rng = random.Random(seed)
    docs: list[hybrid_retrieval.Doc] = []
    for i in range(target_size):
        base = base_docs[i % len(base_docs)]
        text = f"{base.text} (variant {i}, ref {rng.randint(1000, 9999)})"
        docs.append(hybrid_retrieval.Doc(id=f"{base.id}-{i}", text=text, tokens=hybrid_retrieval.tokenize(text)))
    return docs


def _random_embedding(rng: random.Random, dim: int = EMBEDDING_DIM) -> list[float]:
    return [rng.uniform(-1.0, 1.0) for _ in range(dim)]


@dataclass(frozen=True)
class SizeBenchmark:
    corpus_size: int
    bm25_index_seconds: float
    bm25_query_seconds: float
    vector_insert_seconds: float
    vector_query_seconds: float


def benchmark_at_size(corpus_size: int, *, seed: int = 0, query: str = "why do batteries drain fast") -> SizeBenchmark:
    docs = generate_synthetic_corpus(corpus_size, seed=seed)
    rng = random.Random(seed)

    # BM25: hybrid_retrieval.bm25_rank rebuilds its document-frequency index
    # from scratch on every call (matching how rag_engine.py actually uses
    # it today) — "indexing" and "querying" happen in the same call, so
    # the split below is: one bm25_rank() call = index-from-scratch + query.
    start = time.perf_counter()
    hybrid_retrieval.bm25_rank(query, docs, top_k=5)
    bm25_total = time.perf_counter() - start
    # A second, separate query against the same (still from-scratch) index
    # to get a query-only cost isolated from doc-frequency computation.
    start = time.perf_counter()
    hybrid_retrieval.bm25_rank(query, docs, top_k=5)
    bm25_query_only = time.perf_counter() - start
    bm25_index_only = max(0.0, bm25_total - bm25_query_only)

    # Vector store: insert once (this is the point of a persistent store),
    # then query — the two costs are genuinely separate operations here,
    # unlike BM25's from-scratch-every-call approach above. A real temp
    # file, not ":memory:" — sqlite3's in-memory mode gives each new
    # connection its own separate database, and VectorStore opens a fresh
    # connection per call, so ":memory:" would silently lose the table
    # between upsert_many() and search().
    with tempfile.TemporaryDirectory() as tmp_dir:
        store = VectorStore(Path(tmp_dir) / "bench.sqlite")
        records = [VectorRecord(id=doc.id, text=doc.text, embedding=_random_embedding(rng)) for doc in docs]

        start = time.perf_counter()
        store.upsert_many(records)
        vector_insert = time.perf_counter() - start

        query_embedding = _random_embedding(rng)
        start = time.perf_counter()
        store.search(query_embedding, top_k=5)
        vector_query = time.perf_counter() - start

    return SizeBenchmark(
        corpus_size=corpus_size,
        bm25_index_seconds=bm25_index_only,
        bm25_query_seconds=bm25_query_only,
        vector_insert_seconds=vector_insert,
        vector_query_seconds=vector_query,
    )


def run_benchmark(sizes: list[int] | None = None) -> list[SizeBenchmark]:
    sizes = sizes if sizes is not None else [10, 100, 1000, 5000, 10000]
    return [benchmark_at_size(size) for size in sizes]


if __name__ == "__main__":
    print(f"{'size':>6s}  {'bm25_index_ms':>14s}  {'bm25_query_ms':>14s}  {'vec_insert_ms':>14s}  {'vec_query_ms':>13s}")
    for result in run_benchmark():
        print(
            f"{result.corpus_size:>6d}  "
            f"{result.bm25_index_seconds * 1000:>14.2f}  "
            f"{result.bm25_query_seconds * 1000:>14.2f}  "
            f"{result.vector_insert_seconds * 1000:>14.2f}  "
            f"{result.vector_query_seconds * 1000:>13.2f}"
        )

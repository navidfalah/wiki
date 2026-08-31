# 31 — Vector/Graph Storage and Scalability Benchmark

Two flat-file-to-persistent-store migrations, plus the benchmark that
answers the question task #5 explicitly left open: does corpus scale
change the BM25-vs-vector-search picture.

| | |
|---|---|
| Persistent vector store | `compiler/vector_store.py` |
| Persistent graph store | `compiler/graph_store.py` |
| Benchmark | `compiler/scalability_benchmark.py` |
| Tests | `test_vector_store.py`, `test_graph_store.py`, `test_scalability_benchmark.py` |

## What "migrate to vector/graph storage" means here

Not a claim to stand up pgvector or Neo4j (unavailable in this
environment, and arguably the wrong scale for a personal wiki anyway) —
the actual gap this closes is that `rag_engine.build_corpus()` and
`retrieve_hybrid()` rebuild and re-embed the entire corpus from scratch on
every single call ([25](./25-hybrid-retrieval.md)), and the claim/entity
graphs from tasks [#1](./21-trust-eval-dataset.md) and
[#6](./26-entity-resolution.md) only ever exist in memory, rebuilt from a
JSON file or a fresh resolution pass every time. Both modules here are the
same shape as `LLMClient`'s existing SQLite response cache
(`llm_client.py`) — a small, dependency-free, persistent store you insert
into once and query many times, surviving process restarts:

- **`VectorStore`** — SQLite-backed, brute-force cosine search over stored
  embeddings. No ANN index — deliberately simple, and the benchmark below
  is exactly what shows where that simplicity starts to cost real latency.
- **`GraphStore`** — SQLite nodes/edges tables. `import_claim_group()` is
  the adapter that loads a `trust_eval_dataset.ClaimGroup` (task #1's
  in-memory schema) into it — tested against the real pilot dataset
  (`test_import_claim_group_loads_the_real_pilot_dataset`), including a
  spot-check that `nova_read_interval`'s `supersedes` edge is queryable via
  `store.incoming("nri-1", edge_type="supersedes")`.

Neither is wired into the live pipeline yet (`rag_engine.py` still rebuilds
its corpus per call, `trust_propagation.py` still operates on in-memory
`ClaimGroup` objects) — that wiring is a reasonable next step once the
benchmark below says it's worth it, not assumed here.

## The benchmark: BM25 vs. a naive vector store, by corpus size

`scalability_benchmark.py` scales `retrieval_eval_dataset.py`'s ~24 real
passages up to a target size by replication with a per-copy numeric suffix
(clearly synthetic scaling data, not a claim about what a 10,000-document
personal wiki would actually contain), then times: BM25 indexing+query
(`hybrid_retrieval.bm25_rank`, rebuilding its index from scratch every call
— matching how `rag_engine.py` actually uses it today) against
`VectorStore` insert-once-then-query (seeded-random 128-dimensional
vectors — see "What isn't measured" below for why real embeddings aren't
used).

Real numbers, this machine, `python scalability_benchmark.py`:

| Corpus size | BM25 index (ms) | BM25 query (ms) | Vector insert (ms) | Vector query (ms) |
|---|---|---|---|---|
| 10 | 0.03 | 0.06 | 2.63 | 0.97 |
| 100 | 0.08 | 0.43 | 9.24 | 5.99 |
| 1,000 | 0.47 | 3.67 | 77.01 | 60.17 |
| 5,000 | 0.66 | 21.74 | 376.18 | 361.45 |
| 10,000 | 1.60 | 51.42 | 987.99 | 984.45 |

**Honest, somewhat surprising finding: the naive `VectorStore` does not
scale competitively against in-memory BM25 in this range.** At 10,000
documents, BM25 (rebuilding its index from scratch every call) takes ~51ms
to query; the "persistent" vector store — which only has to *search*, since
insertion already happened — takes ~984ms, roughly 19x slower, and its
insert cost (~988ms for 10k records) is comparable to its query cost. Two
concrete reasons, not a mystery: (1) `VectorStore.search()` fetches and
JSON-deserializes *every* stored vector on every call
(`all_records()` — no way to search without materializing the whole
table with a brute-force design), and (2) BM25 operates on plain Python
lists already held in memory, with no serialization or disk I/O at all.
This is, concretely, *why* production vector databases use an ANN index
(HNSW, IVF, etc.) instead of brute force — this benchmark reproduces the
motivation for that design choice rather than assuming it.

**Practical reading for this project:** at the corpus sizes a personal
wiki plausibly reaches (task #5's 24-passage pilot, or even a few thousand
compiled pages), BM25 alone remains a perfectly reasonable default —
exactly what `rag_engine.retrieve()` already does. `VectorStore` becomes
worth its complexity only once (a) embeddings are actually in play (task
#5's `retrieve_hybrid()` tier) *and* (b) an ANN index replaces the
brute-force scan — neither of which this task claims to have delivered.

## What isn't measured

**Retrieval quality at scale** (Recall@5/nDCG@5 for BM25 vs. real
embeddings as corpus size grows) is not measured here — this environment
has no `OPENAI_API_KEY`, so there's no real embedding model to generate
query/document vectors with. The random vectors used above measure
`VectorStore`'s raw indexing/search *infrastructure* cost, which is a
legitimate and separate question from retrieval quality, but is not a
substitute for it. Re-running task #5's `retrieval_eval.py` comparison at
these same corpus sizes, once real embeddings are available, is the
concrete next step — [25-hybrid-retrieval.md](./25-hybrid-retrieval.md)
already named this as the open question this benchmark was built to help
answer, and it's now half-answered: the infrastructure question (can a
naive vector store even keep up) turned out to matter as much as the
quality question originally posed.

## Next

- [25-hybrid-retrieval.md](./25-hybrid-retrieval.md) — the BM25-vs-TF-IDF-at-small-scale finding this benchmark extends
- [21-trust-eval-dataset.md](./21-trust-eval-dataset.md) / [26-entity-resolution.md](./26-entity-resolution.md) — the in-memory graph structures `GraphStore`/`import_claim_group()` give a persistent home to

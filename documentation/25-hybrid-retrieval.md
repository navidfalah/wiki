# 25 — Hybrid Retrieval (BM25 + Embeddings + Reranker)

`rag_engine.py`'s chat originally ranked passages with an ad hoc TF-IDF-style
scorer (see [20](./20-email-resources-and-chat-engines.md)). This replaces
that scorer with a three-tier retrieval stack, each tier independently
optional so the chat still works with zero setup — a corpus and nothing
else — exactly like before.

| | |
|---|---|
| Primitives (BM25, embeddings, RRF, LLM rerank) | `compiler/hybrid_retrieval.py` |
| Embedding calls + cache | `LLMClient.embed_text()` in `compiler/llm_client.py` |
| Wiring into the chat | `rag_engine.retrieve()` / `rag_engine.retrieve_hybrid()` |
| Eval dataset (reuses task #1's grounded quotes) | `compiler/retrieval_eval_dataset.py` |
| Eval script (Recall@5 / nDCG@5) | `compiler/retrieval_eval.py` |
| Tests | `test_hybrid_retrieval.py`, `test_llm_client_embed.py`, `test_retrieval_eval_dataset.py`, `test_retrieval_eval.py`, plus new cases in `test_rag_engine.py` |

## The three tiers

1. **BM25** (`hybrid_retrieval.bm25_rank`) — Okapi BM25, stdlib only. This
   is what `rag_engine.retrieve()` now uses directly; it's the new
   always-available default, same role the original TF-IDF scorer played.
2. **Embeddings + reciprocal rank fusion** — `LLMClient.embed_text()` calls
   an OpenAI-compatible embeddings endpoint (default
   `text-embedding-3-small`, overridable via `OPENAI_EMBEDDING_MODEL`),
   cached in the same SQLite cache `generate_response()` uses (a JSON-encoded
   vector under a `<embedding>`-tagged key — no new cache table).
   `hybrid_retrieval.reciprocal_rank_fusion()` merges the BM25 and embedding
   rankings by rank position, not raw score — BM25 scores and cosine
   similarities aren't on comparable scales, so fusing by rank avoids having
   to normalize either one.
3. **LLM rerank** — `hybrid_retrieval.llm_rerank()` sends the fused
   shortlist to the chat model with a prompt asking for a relevance-ordered
   list of indices, and reorders accordingly. A malformed or missing
   response falls back to the original order rather than guessing (same
   "don't act on an untrustworthy parse" pattern as `extraction_critic.py`).

`rag_engine.retrieve_hybrid()` wires all three together and degrades one
tier at a time on failure: no LLM configured → BM25 only; embeddings call
fails → BM25-only ranking feeds the (still-attempted) reranker; reranker
call fails → the fused BM25+embeddings ranking is returned as-is. Every
degradation path is covered by a dedicated test in `test_rag_engine.py`
(`test_retrieve_hybrid_degrades_gracefully_when_embeddings_fail` /
`..._when_rerank_fails`).

## Result 1 (no API key needed): BM25 vs. the original TF-IDF scorer

`retrieval_eval.py` keeps the *exact* original scoring formula
(`legacy_tfidf_rank`) as an isolated, clearly-labeled baseline — nothing
else in the codebase uses it anymore — and scores it against the same
hand-labeled queries as BM25. `retrieval_eval_dataset.py` builds its corpus
by repurposing `data/trust_eval_dataset.json`'s already-grounded claim
quotes as retrievable passages (a different, new annotation on top of that
data: which claims are *topically relevant* to each hand-written query,
independent of whether that claim is trust-labeled `correct` or
`superseded` — a query about a controversy should surface both sides).

Aggregate (mean over 8 queries, `k=5`):

| Tier | Recall@5 | nDCG@5 |
|---|---|---|
| `legacy_tfidf` | 0.70 | 0.77 |
| `bm25` | 0.70 | 0.77 |

**Identical in aggregate — but not per-query**, and that's the actual
finding, not the headline number:

| Query | legacy recall / nDCG | bm25 recall / nDCG |
|---|---|---|
| q-read-interval | 0.62 / 1.00 | 0.50 / 0.79 |
| q-battery-cell | 0.50 / 0.72 | 0.50 / 0.72 |
| q-battery-life | 0.20 / 0.13 | **0.00 / 0.00** |
| q-herbal-preset | 1.00 / 1.00 | 1.00 / 1.00 |
| q-relay-drain | 0.67 / 0.77 | **1.00 / 0.97** |
| q-cr2450-mixup | 1.00 / 1.00 | 1.00 / 0.97 |
| q-hourly-vs-15min | 0.60 / 0.65 | 0.60 / 0.70 |
| q-relay-sleep-timer-fix | 1.00 / 0.92 | 1.00 / 1.00 |

The two formulas win on different queries (legacy on `q-read-interval` and
`q-battery-life`; BM25 clearly on `q-relay-drain`) and the wins happen to
cancel out in the mean. **Honest reading: BM25's usual advantages — term
saturation (repeated terms give diminishing returns) and document-length
normalization — don't show a clear net win at this corpus's scale (24 short,
near-uniformly-sized passages).** Those advantages are expected to matter
more as passages vary more in length and the corpus grows past what a
tie-heavy top-5 window can absorb — exactly the regime task #11's
scalability benchmark should test this comparison against, rather than
claiming a win here that the pilot data doesn't actually show.

Why keep BM25 as the new default despite the tie, rather than reverting: it
is the theoretically better-grounded formula (used at production scale
across real search systems, unlike the ad hoc TF-IDF variant it replaces),
it doesn't regress anything on this pilot set, and — separately from
retrieval quality — it's also the base ranking `retrieve_hybrid()`'s
embedding fusion and reranking stages build on, so having a properly-formed
BM25 tier matters even where its standalone score ties the baseline.

## Result 2 (requires `OPENAI_API_KEY`): hybrid and reranked tiers

Not run in this environment — no API key is configured here.
`retrieval_eval.py` prints a clear skip message rather than fabricating
numbers, same pattern as `extraction_critic_eval.py`
([24](./24-extraction-critic.md)). Run it once a key is available:

```bash
cd compiler
python retrieval_eval.py   # needs OPENAI_API_KEY in .env
```

It will report Recall@5/nDCG@5 for `hybrid_bm25_embeddings` (BM25 fused
with embedding similarity) and `hybrid_reranked` (that fusion, reranked by
the chat model) against the same queries, letting a direct comparison
against the `bm25`-only numbers above replace this paragraph with real
results.

## What's mechanically verified without a key

`test_hybrid_retrieval.py` (14 tests) covers BM25 ranking/edge-cases,
cosine similarity properties, RRF's rank-based fusion behavior (including a
document missing from one of the fused lists), and the LLM reranker's
parsing/fallback/`top_n` behavior via a fake LLM. `test_llm_client_embed.py`
(6 tests) covers `embed_text()`'s cache hit/miss behavior, retry-then-succeed,
retry exhaustion, and the no-API-key error path against a mocked OpenAI SDK
boundary — no network calls, no key required. `test_rag_engine.py` adds 6
tests for `retrieve_hybrid()`'s tier-by-tier behavior and degradation paths.

## Next

- [20-email-resources-and-chat-engines.md](./20-email-resources-and-chat-engines.md) — the chat engine this retrieval stack backs
- [21](./21-trust-eval-dataset.md)–[23](./23-trust-propagation-evaluation.md) — the dataset this task's eval corpus was built from, and the unrelated (but similarly-shaped) trust-propagation evaluation
- Task #11 (still open): vector/graph storage + scalability benchmark — the natural place to re-run this BM25-vs-legacy comparison at a corpus size where a difference might actually show

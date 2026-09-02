# 34 — RAG Architectures (Naive, HyDE, RAG-Fusion, GraphRAG-lite, Corrective)

`hybrid_retrieval.py` + `rag_engine.retrieve_hybrid()` ([25](./25-hybrid-retrieval.md))
cover one family of RAG design: retrieve, optionally fuse in embeddings,
optionally rerank with the chat model. That's the *hybrid retrieve-and-rerank*
architecture. The published literature has several other shapes RAG commonly
takes, each solving a different failure mode of plain retrieve-then-read.
This task researches five of them and implements each as its own,
independently selectable, independently testable strategy rather than a
variation on the existing one — same "one small pure module" pattern the
rest of the compiler follows (`trust.py`, `analytics.py`,
`hybrid_retrieval.py`).

| | |
|---|---|
| Implementation | `compiler/rag_architectures.py` |
| Shared types (`Passage`, `ScoredPassage`, corpus indexing) | `compiler/rag_types.py` |
| Settings field | `RagSettings.architecture` (`compiler/rag_settings.py`) |
| Wiring into chat | `rag_engine._retrieve()` dispatches on `architecture` |
| Settings UI | `/rag-architecture` (`frontend/src/views/rag-architecture.ejs`) |
| Tests | `compiler/tests/test_rag_architectures.py` |

## The research: what each architecture solves

**Naive RAG** (Lewis et al., 2020, the paper that coined "RAG") is the
original retrieve-then-read pipeline: rank once, stuff the top-k into the
prompt, generate. It has no query understanding, no correction, no
diversification — whatever the first ranking pass returns is what the model
sees. Every architecture below exists because naive RAG fails in a specific,
well-documented way, and this repo already had `rag_engine.retrieve()`
(plain BM25) doing exactly this job; `rag_architectures.retrieve_naive()`
reimplements it standalone (not by importing `rag_engine`, to keep the
dependency one-directional — see the module docstring) so it's an explicit,
selectable baseline rather than an implicit default.

**HyDE — Hypothetical Document Embeddings** (Gao et al., 2022) targets the
query/document embedding mismatch: a short question ("why do batteries drain
so fast?") and the passage that answers it ("relay mode increases radio duty
cycle by 30%...") don't always sit close together in embedding space, even
though they're topically related — questions and answers are different
*kinds* of text. HyDE's fix: ask the LLM to write a fake answer first, then
embed *that* (a same-kind-of-text passage) and rank the corpus against it.
It's allowed to hallucinate specifics, because the hypothetical document is
never shown to the user — only its embedding's *direction* in vector space
is used. `retrieve_hyde()` fuses this against plain BM25 with reciprocal
rank fusion so a badly-hallucinated hypothetical can't erase an obvious
keyword match.

**RAG-Fusion** (Rackauckas, 2024) targets query underspecification from the
other direction: instead of changing *what* gets embedded, it changes *how
many ways* the question gets asked. The LLM generates a few alternative
phrasings (a synonym swap, a narrower version, a broader version), each is
retrieved independently, and the rankings are fused with the same
reciprocal-rank-fusion primitive HyDE and the hybrid stack already use. A
single phrasing's keyword or embedding overlap can miss a passage that uses
different vocabulary for the same concept; five phrasings rarely all miss
the same passage.

**GraphRAG-lite / link-expansion** (in the spirit of Microsoft's GraphRAG,
2024, scaled to what this repo already has rather than building a full
knowledge-graph-construction pipeline) targets a different gap: a flat
ranking only ever surfaces passages that share vocabulary or embedding
similarity with the query, never passages that are *structurally* relevant
but textually distant. This wiki already has real structural relevance,
for free: `linker.py` cross-links every synthesized page to the entities and
concepts it mentions. `retrieve_graph()` reads those markdown links straight
out of the already-compiled corpus (no separate graph-construction step),
ranks by BM25 as usual, then walks the top pages' own links outward
(configurable hop count) to pull in one representative passage per newly
reached page — decayed 0.5x per hop so a directly relevant passage is never
outranked by a tangentially-linked one. This is the only new architecture
that needs neither an LLM nor embeddings; it stays in the same
zero-API-setup tier as BM25 itself.

**Corrective RAG / CRAG-lite** (Yan et al., 2024) targets silent retrieval
failure: naive RAG has no way to notice when its own top result is actually
irrelevant, so it generates a confident-sounding answer from garbage
context anyway. CRAG's fix is a self-check: grade the retrieved passages'
relevance, and if the grade isn't confidently good, take a corrective
action before generating. The original paper's corrective action includes a
live web search fallback; there's no external search available here, so
`retrieve_corrective()`'s correction is query rewriting (ask the LLM for a
broader/differently-worded query) plus a second retrieval pass, fused with
the first via reciprocal rank fusion. Grading itself degrades the same way
everything else in this repo does: an LLM classification call
(CORRECT/AMBIGUOUS/INCORRECT) when one is configured, a keyword-coverage
heuristic over the top passage otherwise — cruder, but the same three-way
outcome, so the corrective loop still runs with zero API setup.

## Why these five specifically

They cover four structurally different intervention points in the
retrieve-then-read pipeline, so "implement several RAG architectures"
means something more than "tune the same pipeline five ways":

| Architecture | Intervenes on |
|---|---|
| Naive | (baseline — no intervention) |
| Hybrid retrieve-and-rerank ([25](./25-hybrid-retrieval.md)) | the ranking signal (keyword -> +embeddings -> +LLM rerank) |
| HyDE | what gets embedded as the "query" |
| RAG-Fusion | how many queries get asked |
| GraphRAG-lite | what counts as a candidate at all (structural neighbors, not just similarity) |
| Corrective RAG | whether to trust the first retrieval pass, after the fact |

## Shared shape

Every architecture in `rag_architectures.py` has the same signature:

```python
def retrieve_xyz(
    query: str,
    corpus: list[Passage],
    *,
    top_k: int = 5,
    llm: LLMClient | None = None,
    bm25_config: hybrid_retrieval.BM25Config = hybrid_retrieval.DEFAULT_BM25_CONFIG,
) -> list[ScoredPassage]:
```

so `rag_architectures.retrieve(architecture_name, ...)` can dispatch to any
of them by string name, and `rag_engine._retrieve()` doesn't need to know
anything about a given architecture's internals — same as how it already
didn't need to know about `hybrid_retrieval.py`'s three tiers. `Passage` and
`ScoredPassage` moved to a new `rag_types.py` module so `rag_architectures.py`
doesn't have to import `rag_engine.py` (which is what dispatches *to* it —
the dependency can only run one way; see `rag_types.py`'s and
`rag_architectures.py`'s module docstrings).

Every architecture degrades to plain BM25 (or, for `retrieve_corrective()`,
to its heuristic grader) when no LLM is configured or an LLM call fails —
the same "chat still works with zero API setup" property the rest of the
retrieval stack already had. `retrieve_naive()` and `retrieve_graph()` don't
touch the LLM at all; they accept the `llm` parameter only so every
architecture shares one call signature.

## Settings and wiring

`RagSettings.architecture` (`compiler/rag_settings.py`) is one of `"hybrid"`
(the pre-existing default — `retrieve_hybrid()`'s tiers, still tuned by
`retrieval_mode`/`bm25_k1`/`bm25_b`/`use_vector_store`), `"naive"`,
`"hyde"`, `"fusion"`, `"graph"`, or `"corrective"`. `rag_engine._retrieve()`
branches on it once: `"hybrid"` keeps calling `retrieve_hybrid()` exactly as
before (so existing behavior, tests, and the vector-store wiring from
[31](./31-vector-graph-storage-and-scalability.md) are all untouched), any
other value calls `rag_architectures.retrieve()`. `retrieval_mode` and
`use_vector_store` are meaningless outside the `"hybrid"` architecture and
are simply ignored — the settings page grays out the "Retrieval strategy"
panel when a non-hybrid architecture is selected, and the chat page's quick
mode toggle shows the active architecture's name in place of the
BM25/hybrid/rerank label when it isn't hybrid.

Same persistence path as the rest of the RAG Architecture settings page:
`backend/src/lib/ragSettings.ts` validates and writes
`data/rag_settings.json`; `compiler/rag_settings.py` reads it back inside
the `cli.py` chat/chat-stream subprocess. No env-var mirroring, no rebuild
required — a changed architecture applies to the next question asked.

## Testing

`test_rag_architectures.py` covers each architecture's happy path (that it
actually surfaces the relevant passage, and — for HyDE, RAG-Fusion, and
GraphRAG — a case a plain BM25 baseline specifically *wouldn't* surface: a
differently-worded query for RAG-Fusion, a page reachable only through a
cross-link for GraphRAG), its no-LLM fallback to BM25, and (for HyDE,
RAG-Fusion, Corrective RAG) graceful degradation when the LLM call itself
fails. `test_rag_engine.py` and `test_hybrid_retrieval.py` are unchanged and
still pass — moving `Passage`/`ScoredPassage`/`_passage_id` to `rag_types.py`
kept `rag_engine.Passage` etc. as re-exports/aliases specifically so nothing
downstream had to change.

## Next

- [25-hybrid-retrieval.md](./25-hybrid-retrieval.md) — the hybrid retrieve-and-rerank architecture this task adds siblings to
- [20-email-resources-and-chat-engines.md](./20-email-resources-and-chat-engines.md) — the chat engine all of these back
- [31-vector-graph-storage-and-scalability.md](./31-vector-graph-storage-and-scalability.md) — the persistent vector/graph stores; GraphRAG-lite deliberately reads the corpus's own markdown links instead of standing up a separate graph store, since `linker.py`'s cross-links already are the graph

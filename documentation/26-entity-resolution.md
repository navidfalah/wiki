# 26 — Entity Resolution / Coreference

`synthesizer.py`'s per-chunk entity extraction returns a name *string* per
mention with no notion that `"Mira Chen"`, `"Mira"`, and
`"mira.chen@auroralabs.example"` are the same person — so what `linker.py`
builds today is a mention graph, not an entity graph. This module resolves
mentions into clusters, turning that into something closer to a real
knowledge graph.

| | |
|---|---|
| Module | `compiler/entity_resolution.py` |
| Eval dataset (real corpus mentions) | `compiler/entity_resolution_eval_dataset.py` |
| Eval script (pairwise precision/recall/F1) | `compiler/entity_resolution_eval.py` |
| Real-corpus wiring | `compiler/entity_graph.py` — see "Wired up: a real entity graph" below |
| Dashboard | `/entities` — `frontend/src/views/entities.ejs` + `client/entities.ts`, bridged via `cli.py`'s `entity-graph` command and `GET /api/entity-graph` |
| Tests | `test_entity_resolution.py`, `test_entity_resolution_eval_dataset.py`, `test_entity_resolution_eval.py`, `test_entity_graph.py` |

## Design: same tiered-degradation shape as hybrid_retrieval.py

Three tiers, each optional, each only running on what the tier before it
left ambiguous — not a fresh pass over everything:

1. **Heuristic** (`heuristic_similarity`, stdlib only, always runs) — exact
   match, one name's tokens being a subset of the other's ("Mira" ⊂ "Mira
   Chen"), and an email's local part matching a plain name
   ("mira.chen@auroralabs.example" → "Mira Chen"), then a generic
   character-sequence ratio (`difflib.SequenceMatcher`) as a weak fallback.
   Only the strong-evidence cases reach the auto-merge threshold (`0.85`);
   anything in the `[0.55, 0.85)` band is *escalated*, not merged.
2. **Embeddings** (only if `embed_fn` is given) — cosine similarity
   (reusing `hybrid_retrieval.cosine_similarity` from task #5) on whatever
   the heuristic tier escalated.
3. **LLM adjudication** (only if an available `llm` is given) — a direct
   yes/no prompt (`ENTITY_ADJUDICATION_SYSTEM_PROMPT`) on whatever's still
   ambiguous after tier 2 (or everything tier 1 escalated, if no `embed_fn`
   was supplied at all).

Clustering itself is a plain union-find over merge decisions
(`resolve_entities()`); the canonical display name for a cluster prefers a
human-readable full name over an email address or a bare first name
(`_pick_canonical_name`), so a cluster containing `"jonah.park@..."`,
`"Jonah"`, and `"Jonah Park"` displays as `"Jonah Park"`, not the email.

## Why this is conservative by design

This repo's own corpus already contains a real, non-hypothetical hard
negative: **Alex Kim**, **Alex Rivera**, and **Sam Rivera** are three
different people who happen to share a first or last name (see
`entity_resolution_eval_dataset.py` for exactly where each name appears).
A resolver that merges on any name-token overlap would wrongly collapse
them. The heuristic tier's subset-of-tokens rule only fires when one full
name's *entire* token set is contained in the other's — "Alex" ⊂ "Alex Kim"
would trigger it, but "Alex Kim" vs. "Alex Rivera" shares only a single
token out of two on each side, so it doesn't, and falls through to the weak
`SequenceMatcher` fallback (scores `< 0.85` for both real cases — see
`test_heuristic_similarity_different_people_sharing_a_*_scores_low`).

## Evaluation

`entity_resolution_eval_dataset.py` holds 16 real mentions across 7 gold
entities (`Mira Chen`, `Jonah Park`, `Alex Kim`, `Alex Rivera`, `Sam
Rivera`, `Nova Widget`, `SenseNode SN-400`), every one grounded — `test_entity_resolution_eval_dataset.py`
verifies each `(mention, source_path)` pair actually appears in its cited
`data/raw/` file (case-insensitively, since a mention is meant to model
what extraction would *output*, e.g. a normalized `"Mira"` from a
transcript that literally reads `"MIRA:"` — not a verbatim quote the way
`trust_eval_dataset.json`'s claims are).

Two of those 16 exercise a second, different kind of hard case beyond the
Alex Kim/Alex Rivera/Sam Rivera name-token collision above: `"Aurora Nova
Widget"` (a longer surface form that should still merge into `nova-widget`)
and `"SenseNode SN-400"` — a *competitor's* product discussed side by side
with Nova Widget in the same document's comparison table. That's a
proximity/co-occurrence hard negative rather than a name-token one: nothing
about "SenseNode SN-400" and "Nova Widget" shares a token, but a resolver
using document-level context carelessly (rather than name evidence) could
still be tempted to associate them since they're always mentioned together.

`entity_resolution_eval.py` computes pairwise precision/recall/F1 (for
every pair of mentions: does "predicted same cluster" agree with "gold
same cluster") — a standard clustering-evaluation metric.

**Result, heuristic tier alone, no API key needed:**

```
precision=1.00 recall=1.00 f1=1.00  (11/11 predicted pairs correct, 11 gold pairs)
```

Every positive merge (Mira/Jonah's three-way name+email clusters, Nova
Widget's three surface forms) and every hard negative (Alex Kim/Alex
Rivera/Sam Rivera staying separate, SenseNode SN-400 staying separate from
Nova Widget) resolves correctly from heuristics alone — the embedding and
LLM tiers have nothing left to adjudicate on *this* dataset, which is
itself the honest limit of what a 16-mention pilot set can show: it was
built around cases the heuristic tier is specifically designed to handle
well. A dataset with genuinely ambiguous cases (e.g. two different real
people who share a full name, or a nickname with no textual overlap at all,
like "Bob" for "Robert") would be needed to actually exercise and evaluate
the embedding and LLM tiers — a direct, named follow-up rather than
something this pilot's perfect score should be read as covering.

## Wired up: a real entity graph

`compiler/entity_graph.py` closes the gap this doc originally left open —
`linker.py`'s mention graph feeding into something clustered. It doesn't
touch `linker.py` or `main.py`'s pipeline itself; instead it's a read-side
adapter, computed on demand, the same posture `/api/knowledge-graph` and
`/api/attention` already use for `state.json`/`index.json`-derived data
rather than adding another persisted output file the pipeline has to know
how to regenerate:

- `mentions_from_state(state)` walks `data/state.json`'s `files[*].chunks[*].entities`
  — exactly the same per-chunk entity mentions `synthesizer.py`'s
  `CHUNK_EXTRACTION_SYSTEM_PROMPT` already extracts and `linker.py`'s
  mention graph is built from — and turns each into a `Mention(name, source, description)`.
- `build_entity_graph(state)` feeds those through `resolve_entities()`
  from this module, heuristic tier only (no `embed_fn`/`llm` passed) — the
  same tier this doc's own eval showed reaches perfect precision/recall on
  this project's real corpus, so the on-demand HTTP endpoint stays free
  and instant, no API key required.
- `entity_graph_payload(state)` sorts clusters by source count (entities
  cited across more sources surface first) and adds summary counts
  (`total_entities`, `total_mentions`, `multi_source_entities`,
  `multi_alias_entities` — the last one is direct evidence of the
  heuristic tier actually merging name/email variants, not just passing
  every mention through as a singleton).

Bridged through the same JSON-in/JSON-out `cli.py` pattern as chat/email/
review (`entity-graph` command, no input needed) and a `GET /api/entity-graph`
route; `/entities` renders it as filterable cards (canonical name, other
aliases, source count, mention count). `test_entity_graph.py` covers
`mentions_from_state()`'s parsing (including malformed/missing chunk data),
the Mira Chen/email/first-name merge case across three distinct sources,
and — again — that the Alex Kim/Alex Rivera/Sam Rivera hard negative stays
apart on synthetic state data shaped like a real compile's output, without
needing an actual `data/state.json` (which requires an LLM run to
produce) checked into the test fixtures.

## Next

- [25-hybrid-retrieval.md](./25-hybrid-retrieval.md) — the tiered-degradation pattern this module reuses, and `cosine_similarity`
- `compiler/synthesizer.py` — `CHUNK_EXTRACTION_SYSTEM_PROMPT`, the source of the raw entity mentions this module resolves
- `compiler/entity_graph.py` — the real-corpus wiring described above
- `compiler/linker.py` — the topic/mention graph this module resolves entities from (unchanged by the wiring — `entity_graph.py` reads the same `state.json` linker.py's own mention graph is built from, independently)

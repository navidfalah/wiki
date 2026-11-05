# 26 — Entity Resolution / Coreference

> Current behavior: Current automatic identity matching only merges normalized exact names. First-name/full-name and email/name inference is no longer automatic. This reduces merge coverage; the earlier pilot scores below do not describe the current default. See [42 — Minimal AI](./42-minimal-ai.md).

The JavaScript compiler's per-chunk extraction returns entity names without
automatically merging first names, full names, or email addresses. The graph
view therefore reports explicit names rather than inferring identity. The
research prototype below explores how those mentions could be resolved. It resolves
mentions into clusters, turning that into something closer to a real
knowledge graph.

| | |
|---|---|
| Runtime graph module | `backend/src/lib/entityGraph.js` |
| Resolver | `compiler/entityResolution.js` |
| Eval dataset (real corpus mentions) | `compiler/entityResolutionEvalDataset.js` |
| Eval script (pairwise precision/recall/F1) | `compiler/entityResolutionEval.js` |
| API | `GET /api/entity-graph` |
| Runtime tests | `backend/src/lib/entityGraph.test.ts` |

The tiered JavaScript resolver described below is a research prototype, not part
of the current application path. The runtime graph groups case-insensitive
exact names and does not call an embeddings or language-model API.

## Design: same tiered-degradation shape as the former hybrid retrieval module

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
   (using a cosine-similarity helper) on whatever
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

`entityResolutionEvalDataset.js` holds 16 real mentions across 7 gold
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

`entityResolutionEval.js` computes pairwise precision/recall/F1 (for
every pair of mentions: does "predicted same cluster" agree with "gold
same cluster") — a standard clustering-evaluation metric.

**Result, heuristic tier alone, no API key needed:**

The value below is the legacy Python evaluation result. Run
`node compiler/entityResolutionEval.js` to reproduce it against the JavaScript
port; it has not been rerun here.

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

## Runtime entity graph

`backend/src/lib/entityGraph.js` reads extracted entity names from the compiler
state and groups case-insensitive exact matches. `GET /api/entity-graph` serves
the result to `/entities`; it does not call embeddings or a language model.
The experimental JavaScript resolver and its pilot evaluation remain separate
research artifacts and do not describe runtime behavior.

## Next

- [25-hybrid-retrieval.md](./25-hybrid-retrieval.md) — the tiered-degradation pattern this module reuses
- `backend/src/lib/wikiCore.js` — compiler extraction of raw entity mentions
- `backend/src/lib/entityGraph.js` — current exact-name graph implementation

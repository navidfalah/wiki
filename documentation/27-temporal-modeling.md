# 27 — Temporal / Bi-Temporal Fact Modeling

Trust propagation (task #2) asks "how much should we believe this claim."
This module asks a different question, purely from *when* things happened:
"what did the corpus say was true on a given date, and what does it say
now." Emails and dated notes make this a natural fit — every claim in
`data/trust_eval_dataset.json` already carries a `date`, and several claim
groups already carry `supersedes` edges recording which claim replaced
which.

| | |
|---|---|
| Module | `compiler/temporal_model.py` |
| Evaluation | `compiler/temporal_model_eval.py` |
| Tests | `test_temporal_model.py`, `test_temporal_model_eval.py` |

## The two time axes

- **Valid time** — the period a claim's asserted value was the current
  answer. Modeled as `[valid_from, valid_until)`: `valid_from` is the
  claim's own date; `valid_until` is the `valid_from` of whichever claim
  supersedes it (`None` if nothing does — still current). This is what
  `as_of()` queries against.
- **Transaction time** — when a fact was *recorded*, which can differ from
  when it was true (a June note describing something true since March).
  `TemporalFact.recorded_at` exists as a placeholder for this distinction,
  but every claim in the current dataset uses the same date for both, so
  it isn't yet a meaningfully separate value — named honestly as a gap
  below, not silently glossed over.

Like `trust_propagation.py`, this module never reads `claim.gold_label` —
`current_claims()` and `as_of()` are derived purely from dates and
`supersedes` edges, so they can be checked against the gold labels as an
independent cross-validation (see Evaluation below), not graded against
their own answer key.

## What it actually answers

Real output from `nova_read_interval`, the Nova Widget default read
interval, which the May 15 spec changed from an earlier "hourly" figure:

```python
as_of(group, timeline, date(2026, 5, 10))  # -> [nri-1], value="hourly"
as_of(group, timeline, date(2026, 6, 1))   # -> [nri-2, ...], value="15 minutes"
```

Ask "what did we believe before the spec" and it correctly returns the
kickoff notes' `hourly` figure; ask "what do we believe now" (or on any
date after May 15) and it correctly returns the spec's `15 minutes` and
everything that corroborates it. `current_claims()` is the same query with
"now" implicit — every claim that's never been superseded.

## Evaluation: does the purely-temporal answer agree with the gold labels?

`temporal_model_eval.py` reuses `trust_propagation_eval.py`'s
`GOOD={correct, scope_dependent}` / `BAD={incorrect, superseded, disputed}`
split (same reasoning: the richer 5-way taxonomy isn't something a binary
"is this claim currently valid" question should be expected to reproduce)
and scores `current_claims()`'s output as a precision/recall problem against
it — no API key needed, everything here is deterministic date/graph logic.

| Group | Precision | Recall |
|---|---|---|
| `nova_read_interval` | 1.00 | 1.00 |
| `nova_battery_cell_type` | **0.83** | 1.00 |
| `nova_battery_life_claim` | **0.80** | 1.00 |
| `teabuddy_herbal_preset_timing` | 1.00 | 1.00 |
| `meshsync_relay_battery_drain_root_cause` | 1.00 | 1.00 |

**Recall is perfect everywhere** — the temporal model never wrongly
excludes a claim that should still count as current. **Precision is
imperfect in two groups, and both are explainable, not bugs:**

- `nova_battery_life_claim` has no `supersedes` edges at all in the
  dataset — its marketing-vs-engineering split is genuinely
  `scope_dependent`/`disputed`, not a supersession, so there's nothing for
  this module to detect there; `current_claims()` correctly returns
  everything, and the "precision" it's scored against a set that includes
  `disputed` (a BAD label) is expected to be < 1 for a group this module
  was never meant to resolve.
- `nova_battery_cell_type` **is** a real finding, and a useful one: `nbc-3`
  (the competitor blog post that documents its own correction inline —
  "an earlier version of this post said CR2450... that was wrong, the
  beta unit uses CR2032") is gold-labeled `superseded`, but
  `data/trust_eval_dataset.json` represents that correction as *one claim
  whose text describes its own history*, not as two claims connected by an
  explicit `supersedes` edge — unlike the directly parallel
  `teabuddy_herbal_preset_timing` group, which *does* split its
  before/after correction into `thp-1`/`thp-2` with a `supersedes` edge
  between them. That's an inconsistency in how task #1's dataset was
  authored, not a limitation of this module's logic — `test_temporal_model_eval.py::test_battery_cell_type_precision_reflects_the_known_annotation_gap`
  pins it down as a named, regression-guarded finding rather than a
  silent gap.

**Why this wasn't retroactively fixed in `data/trust_eval_dataset.json`:**
`nova_battery_cell_type`'s current relation structure is exactly what
[22](./22-trust-propagation-algorithm.md) and
[23](./23-trust-propagation-evaluation.md)'s already-published trust-
propagation numbers were computed against (the `nbc-*` precision@1/pairwise
accuracy figures, the alpha sweep). Editing the graph now to add a proper
`supersedes` edge would be the right fix in isolation, but would silently
invalidate those cited results without re-running and re-publishing them —
worse for the project's honesty than documenting the gap here and treating
"split `nbc-3` into an `nbc-3-old`/`nbc-3-new` pair, matching the
`thp-1`/`thp-2` pattern, then re-run tasks #2/#3's evaluations against the
corrected graph" as a named follow-up.

## Limitations

- **Transaction time isn't actually modeled yet.** `recorded_at` mirrors
  `valid_from` for every claim in the current dataset; distinguishing "when
  something was true" from "when it was written down" needs at least one
  claim in the dataset where those genuinely differ, which none currently
  do.
- **Supersession must be explicit.** As `nbc-3` shows, this module can only
  see `supersedes` edges the extraction/annotation step actually produced
  — it does not infer supersession from a `contradicts` edge plus a later
  date, even though that's a plausible signal. Doing so automatically would
  be a reasonable extension, but risks false supersession (two claims can
  disagree about different, still-simultaneously-true things, as
  `nova_battery_life_claim` shows) if applied naively.
- **No natural-language date parsing.** `as_of()` takes a `datetime.date`,
  not a chat question like "what did we believe in March?" — extracting a
  date from a freeform question reliably enough to trust is a separate,
  harder problem than this task, left unimplemented rather than solved
  with a brittle regex.

## Next

- [21](./21-trust-eval-dataset.md)–[23](./23-trust-propagation-evaluation.md) — the dataset and algorithm this module cross-validates against
- [26-entity-resolution.md](./26-entity-resolution.md) — the other task #6 module built independently of this one, same claim graph

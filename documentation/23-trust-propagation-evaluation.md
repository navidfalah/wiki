# 23 — Trust Propagation Evaluation

The results chapter: formal metrics and ablations for
`compiler/trust_propagation.py` (task #2) against the labeled dataset
(task #1). Everything below was produced by running
`python compiler/trust_propagation_eval.py` against the real
`data/trust_eval_dataset.json` — the numbers are not hand-written, and
`compiler/tests/test_trust_propagation_eval.py` re-asserts the headline
comparisons on every test run so they can't silently drift from the code.

## Metrics

`compiler/trust_propagation_eval.py` collapses the dataset's 5-way gold
label taxonomy to a binary split — `GOOD = {correct, scope_dependent}` vs.
`BAD = {incorrect, superseded, disputed}` — because a v1 propagation
algorithm only outputs one continuous score, and the coarsest meaningful
question a single score can answer is "does this correctly separate the
claims that are wrong or superseded from the ones that aren't."

- **Precision@1** (per claim group, averaged over groups that contain at
  least one BAD claim): is the group's top-scoring claim (or every claim
  tied for top) a GOOD one?
- **Pairwise accuracy** (pooled across all groups, weighted by pair count):
  of every (GOOD, BAD) claim pair within the same group, what fraction does
  the propagated score correctly order GOOD-above-BAD?

Groups with no BAD claims (`meshsync_relay_battery_drain_root_cause`) report
`None` for both — undefined, not a misleadingly perfect score.

## Headline result: propagation vs. the static baseline

`STATIC_BASELINE_CONFIG` (`prior_weight=1`, `supersede_decay=1`) makes
`propagate_group_trust()`'s output reduce to *exactly* `trust.py`'s current
static prior — `test_static_baseline_config_reproduces_prior_exactly`
enforces this bit-for-bit. It is the existing system, not a strawman.

| Config | Precision@1 | Pairwise accuracy |
|---|---|---|
| **Static baseline (= trust.py today)** | **0.25** | **0.12** |
| **Full propagation (default config)** | **1.00** | **0.94** |

The static baseline does badly for a specific, explainable reason: many
claims in a group share the same source type and no matching
`data/source_trust.json` rule, so they get an *identical* prior. When
several claims tie for the group's maximum score and some of those tied
claims are BAD, precision@1 counts it as a miss — which is exactly what
happens when, e.g., a correct and a superseded claim are both plain `text`
sources with no special rule. Static, per-source-type trust structurally
cannot break ties that only relational evidence (who corroborates whom, who
contradicts whom, what got explicitly superseded) can break.

## Ablation: which terms matter

Each row changes exactly one thing relative to `full_default`
(`prior_weight=0.2, corroborate_weight=1, contradict_weight=1,
supersede_weight=1.5, supersede_decay=0.4`):

| Config | Precision@1 | Pairwise accuracy | Reading |
|---|---|---|---|
| `static_baseline` | 0.25 | 0.12 | existing system |
| `full_default` | 1.00 | 0.94 | proposed method |
| `no_corroboration` (`corroborate_weight=0`) | 1.00 | 0.94 | **no effect** on these two metrics |
| `no_contradiction` (`contradict_weight=0`) | 1.00 | 0.71 | contradiction matters |
| `no_supersession` (`supersede_weight=0`, `supersede_decay=1`) | 0.75 | 0.88 | supersession matters most |
| `relational_only` (`prior_weight=0`) | 1.00 | 0.94 | ties full_default |

Two honest findings, not smoothed over:

- **Corroboration doesn't move these particular metrics.** It does move
  individual scores (every corroborated claim's score rises above its
  prior — see `test_corroboration_raises_score_above_prior` and the
  per-claim deltas in [22](./22-trust-propagation-algorithm.md)), but on
  *this* dataset the GOOD/BAD ranking is already decided by
  contradiction/supersession before corroboration's boost changes any
  ordering. A dataset with more claim groups whose only signal is
  corroboration density (agreement without an explicit contradiction) would
  be needed to see corroboration move these two metrics — a concrete
  direction for growing the dataset past its current N=24.
- **Supersession is the single most load-bearing term.** Removing it drops
  precision@1 from 1.00 to 0.75 — it's the term responsible for correctly
  demoting `nova_battery_cell_type`'s explicitly-corrected claim and
  `teabuddy_herbal_preset_timing`'s pre-fix value. This makes sense given
  how the dataset was built: several of its clearest contradictions
  (`supersedes` in the `nova_read_interval` and
  `teabuddy_herbal_preset_timing` groups) are cases where a later source
  explicitly says "this replaces/corrects an earlier one," which is exactly
  what a `supersedes` edge is for.

## The `prior_weight` (alpha) sweep, and why the default is 0.2

| `prior_weight` | Precision@1 | Pairwise accuracy |
|---|---|---|
| 0.0 – 0.25 | 1.00 | **0.94** (flat maximum) |
| 0.3 | 1.00 | 0.82 |
| 0.4 – 0.6 | 1.00 | 0.76 |
| 0.7 – 0.9 | 1.00 | 0.47 |
| 1.0 (= static baseline) | 0.50 | 0.24 |

Pairwise accuracy is monotonically non-increasing as `prior_weight` rises
(`test_prior_weight_sweep_is_monotonic_non_increasing_on_this_dataset`
holds this as a regression check, with the explicit caveat that this is an
observed property of *this* dataset, not a claimed universal property of
the algorithm). `trust_propagation.py`'s shipped default was originally set
to `0.3` by inspection during task #2, before this sweep existed; the sweep
shows `0.3` is already past the start of the drop-off, so the default was
revised to `0.2` — in the middle of the flat, maximal region, rather than at
its edge (`0.0`, which would discard the static prior entirely, including
for claims with no relational evidence at all to fall back on).

## Mean propagated score by gold label (full_default)

| Gold label | Mean score |
|---|---|
| `scope_dependent` | 0.54 |
| `correct` | 0.48 |
| `disputed` | 0.33 |
| `superseded` | 0.15 |

Monotonic in the expected direction (`correct`/`scope_dependent` well above
`disputed`/`superseded`), and `scope_dependent` scoring *above* `correct` on
average is itself informative: those claims (Nova Widget's marketing vs.
engineering battery-life figures) are heavily corroborated by multiple
sources acknowledging the split exists, which the propagation algorithm
correctly reads as strong relational support — it has no way to know
"corroborated" and "not actually in conflict" are different things here,
which is precisely the scope-awareness gap named as a limitation below.

## Limitations of this evaluation

- **N=24 claims, 5 groups.** Enough for a first ablation and to catch the
  static-baseline tie-breaking failure mode, not enough to claim the
  `prior_weight=0.2` default (or the relative ranking of the other terms)
  generalizes past this pilot. Growing the dataset (task #1's own noted
  follow-up) is the direct way to firm this up.
- **The binary GOOD/BAD collapse hides real structure.** `scope_dependent`
  and `disputed` are meaningfully different from `incorrect`/`superseded`
  and from each other; a finer ordinal metric (e.g. rank correlation
  against an explicit severity ordering) would say more than precision@1 —
  left as follow-up since the coarser binary split was enough to produce a
  clear, defensible headline result here.
- **No cross-group dependency, again.** `nova_battery_life_claim/nbl-5`
  (`disputed` because it depends on `nova_read_interval`'s gold labels) is
  scored using only its own group's relations, same limitation as
  documented in [21](./21-trust-eval-dataset.md) and [22](./22-trust-propagation-algorithm.md).
- **This is still a synthetic corpus.** As in [21](./21-trust-eval-dataset.md#known-limitations):
  useful for validating the algorithm's and evaluation's mechanics, not a
  substitute for running the same evaluation against a real personal
  corpus once one is available.

## Next

- [21-trust-eval-dataset.md](./21-trust-eval-dataset.md) — the dataset these results are computed against
- [22-trust-propagation-algorithm.md](./22-trust-propagation-algorithm.md) — the algorithm being evaluated
- `compiler/trust_propagation_eval.py` — run it directly (`python trust_propagation_eval.py`) to reproduce every number above

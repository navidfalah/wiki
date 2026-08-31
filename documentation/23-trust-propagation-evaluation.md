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
  ordering. Tried the follow-up this section originally called for:
  `nova_ip_rating`, a sixth claim group added specifically because it's
  pure corroboration (every source agrees, no contradiction or
  supersession at all — see [21](./21-trust-eval-dataset.md)). Its
  `no_corroboration` ablation *still* shows no effect on precision@1 /
  pairwise_acc, and the reason is structural, not a fluke: every claim in
  that group shares the same gold label (`correct`), so pairwise_acc — a
  *ranking* metric — has no wrong ordering to fix within the group; there's
  nothing for corroboration's score boost to demote or promote past. The
  "Mean score by gold label" breakdown below is where corroboration's
  effect actually shows up (it lifts absolute scores), not these two
  ranking metrics — worth remembering when reading precision@1/pairwise_acc
  as "the whole story."
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

## Does an upstream entity-resolution error compound into a worse trust score?

Trust propagation and entity resolution ([26](./26-entity-resolution.md))
aren't wired together in this codebase — `trust_eval_dataset.json`'s claim
groups are hand-labeled, not derived by running `entity_resolution.py`'s
clustering over the corpus. So this question has no live code path to
measure yet, but it has a concrete, reproducible *simulated* answer:
`trust_propagation_eval.simulate_isolated_claim()` takes one real claim,
computes its propagated score in its correct group, then computes what it
would score if wrongly split into its own singleton group — dropping every
relation that touched it, exactly what `graph_store.export_claim_group()`'s
cross-group edge dropping already does for any relation whose endpoints
land in different groups. That's precisely what a false-negative entity
merge (two mentions of the same real-world subject resolved to different
clusters) would cause once claim groups are derived from resolved entities
instead of hand-labeled.

Run against `nova_read_interval`'s `nri-1` — a `superseded` (bad) claim
whose low score depends entirely on the `contradicts`/`supersedes` edges
pointing at it from later, corrected sources:

```
nri-1 (gold=superseded): correctly grouped=0.069  wrongly isolated=0.500  delta=+0.431
```

Losing its contradicting evidence doesn't just make the score "worse" in
some vague sense — it moves a claim from clearly-flagged-as-wrong (0.069)
to a middling, easy-to-mistake-for-legitimate score (0.500, exactly its
static prior with zero relational adjustment). The direction matters: the
error doesn't add noise symmetrically, it specifically erases the signal
that would have caught a wrong claim, making it look *more* trustworthy,
not less. Given that the `no_contradiction` ablation above already shows
contradiction-edge evidence is the single largest contributor to
pairwise_acc after supersession, an entity-resolution false negative is
not a minor, containable failure mode — it silently disables the exact
mechanism that catches superseded/wrong claims for whichever claim gets
cut off. `tests/test_trust_propagation_eval.py`'s
`test_simulate_isolated_claim_*` tests lock this finding in as a
regression check, and `simulate_isolated_claim()` can be re-run against any
other claim/group pair to check whether the pattern holds generally (it's
expected to: any claim whose gold label depends on relational evidence,
not just its prior, will show the same direction of effect).

This is a named risk for the eventual entity-resolution → trust-propagation
wiring, not a reason not to build it: the fix is for that integration to
be conservative about splitting (favor under-merging risk over
over-merging risk, or escalate ambiguous cases to a human/LLM tier — which
`entity_resolution.py` already does for exactly this reason, see
[26](./26-entity-resolution.md)) rather than a reason to keep the two
systems disconnected.

## Limitations of this evaluation

- **N=29 claims, 6 groups.** Enough for a first ablation and to catch the
  static-baseline tie-breaking failure mode, not enough to claim the
  `prior_weight=0.2` default (or the relative ranking of the other terms)
  generalizes past this pilot. Growing the dataset (task #1's own noted
  follow-up, and task #23's growth pass, which added `nova_ip_rating`) is
  the direct way to firm this up — and the `prior_weight` sweep's cliff
  shape (flat at 0.94 through 0.2, then dropping sharply) held unchanged
  after that addition, which is at least one data point that the shape
  isn't an artifact of the original 5-group dataset specifically.
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

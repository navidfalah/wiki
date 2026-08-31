# 22 — Trust Propagation Algorithm

The thesis-track spine itself: `compiler/trust_propagation.py` extends
`trust.py`'s static, rule-based trust with relational evidence from a claim
graph's `corroborates`/`contradicts`/`supersedes` edges (the schema
[21-trust-eval-dataset.md](./21-trust-eval-dataset.md) defines). This module
implements the algorithm; task #3 (still to come) is the formal evaluation —
precision/ranking metrics and per-term ablations against the labeled
dataset. What's below is the design and a preliminary, informal look at its
behavior, not a validated result.

## Why static rules aren't enough

`trust.py` assigns a claim's trust from its source's path/type alone — a
glob rule or a source-type default. That can't express two things this
project's own corpus actually needs:

- **The same source can be right about one fact and wrong about another.**
  `notes/2026-05-01-kickoff-notes.md` correctly states the battery cell
  (CR2032) and incorrectly states the read interval (hourly, later
  corrected to 15 minutes). A per-source trust score can't capture that;
  trust has to live on the *claim*, not the file.
- **Corroboration and contradiction are information.** Five independent
  sources agreeing on "15 minutes," and the one source that says "hourly"
  being explicitly and repeatedly called out as wrong by name — that's
  exactly the kind of signal a static rule engine throws away.

## Algorithm

Implemented in `propagate_group_trust()` (per claim group) and
`propagate_dataset_trust()` (all groups, run independently — see
[21](./21-trust-eval-dataset.md#known-limitations) on why there are no
cross-group edges yet):

1. **Prior.** Each claim's source gets a static prior via
   `trust.resolve_trust()` — literally the same function the existing
   References & Trust table uses — normalized to `[0, 1]`.
2. **Relational evidence, per iteration.** A claim's `support` is:
   `Σ(corroborating neighbors' current trust) − Σ(contradicting neighbors' current trust) − Σ(superseding neighbors' current trust)`.
   `contradicts` is treated symmetrically (both sides of a disagreement are
   penalized by the other's trust; the edge's direction doesn't privilege
   either claim — the algorithm never reads which one is actually correct).
   `supersedes` only penalizes the superseded (`to`) claim.
3. **Supersession decay.** On top of the relational penalty, a claim that
   is the target of a `supersedes` edge is multiplicatively decayed
   (`supersede_decay ** (number of supersedes edges targeting it)`),
   because "this was explicitly replaced" is a stronger, more specific
   signal than ordinary disagreement.
4. **Blend and iterate.** `support` is squashed through a sigmoid (0 support
   → neutral 0.5) and blended with the static prior:
   `score = clamp01((prior_weight · prior + (1 − prior_weight) · sigmoid(support)) · decay)`.
   This repeats for `iterations` rounds, synchronously (Jacobi-style, like
   PageRank's power iteration) — a claim's neighbors' *previous-round*
   scores feed the current round, so influence can propagate transitively
   (a claim corroborated by a claim that is itself well-corroborated ends up
   trusted more than one corroborated by a single weak claim).

**Critically: `propagate_group_trust()` never reads `claim.gold_label`.**
That field exists solely for the dataset in [21](./21-trust-eval-dataset.md)
to be scored against; reading it here would mean the algorithm grades its
own exam. `tests/test_trust_propagation.py::test_gold_label_never_affects_the_propagated_score`
enforces this empirically — it mutates every claim's gold label and asserts
the computed scores don't move by a single bit.

## Design choices, made explicit

- **`prior_weight = 0.2` (not 0.5).** This is now an evidence-based choice,
  not a guess — see [23-trust-propagation-evaluation.md](./23-trust-propagation-evaluation.md)
  for the actual sweep. Pairwise ranking accuracy on the pilot dataset is
  flat at its maximum across `prior_weight` in `[0.0, 0.25]` and drops
  sharply from `0.3` onward, because `data/source_trust.json`'s
  `samples/**`/`dummy-test/**` → `unverified` rule (prior `0`) starts to let
  a higher-prior `superseded` claim outrank well-corroborated `correct`
  claims sourced from those directories once the prior counts for enough of
  the blend. `0.2` sits in the middle of the flat, high-accuracy region
  rather than at its edge (`0.0`), so a claim with no relational evidence at
  all still falls back to something informed by its static prior instead of
  a fixed neutral score.
- **`PropagationConfig.with_overrides()`** exists specifically so an
  ablation script can hold everything constant and zero out one term at a
  time (`corroborate_weight=0`, `supersede_weight=0`, `prior_weight=0` for
  "relational evidence only," `prior_weight=1` for "static baseline only,"
  etc.) without duplicating the algorithm.
- **Per-group, not global, propagation.** A claim's trust only depends on
  claims in the *same* claim group. This is simpler and matches the eval
  dataset's structure, but it's also why `nova_battery_life_claim/nbl-5`
  (labeled `disputed` because it depends on a *different* group's gold
  labels) can't be resolved by this algorithm alone yet.

## Observations at the evidence-based default (`prior_weight=0.2`)

Running the default config against the real pilot dataset
(`propagate_dataset_trust(load_trust_eval_dataset())`) — see
[23-trust-propagation-evaluation.md](./23-trust-propagation-evaluation.md)
for the formal metrics this summarizes:

- In every group that contains both `correct` and `superseded` claims, every
  `correct` claim's score now beats every `superseded` claim's score, not
  just on average — `nova_read_interval`'s lowest `correct` score (0.39)
  still clears its `superseded` claim (0.07); `nova_battery_cell_type`'s
  lowest `correct` score (0.35) clears its `superseded` claim (0.26); same
  for `teabuddy_herbal_preset_timing` (0.40 vs. 0.11). At the earlier
  `prior_weight=0.3` this didn't fully hold (see 23's ablation) — the lower,
  evidence-based default resolves it.
- `nova_battery_cell_type/nbc-1` and `nova_read_interval/nri-1` (same file,
  same prior) diverge sharply once propagated (0.63 vs. 0.07) — the
  targeted "per-claim, not per-source" property the dataset was built to
  test.
- `meshsync_relay_battery_drain_root_cause` (the deliberately dispute-free
  cluster) ends with every claim's score at or above its prior, and no
  claim is penalized — the algorithm doesn't manufacture disagreement where
  none exists.

## Next

- [21-trust-eval-dataset.md](./21-trust-eval-dataset.md) — the claim graph schema and labeled ground truth this operates on
- [23-trust-propagation-evaluation.md](./23-trust-propagation-evaluation.md) — the formal precision/ranking evaluation and per-term ablations that justify prior_weight=0.2 and the other defaults
- `compiler/trust.py` — the static prior this module extends, still the source of truth for the live References & Trust table until the evaluation's results are judged strong enough to integrate

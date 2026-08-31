# 29 — Active-Learning Human Review/Correction Loop

Every prior task in this series (trust propagation, temporal modeling,
entity resolution) produces a *judgment* — a score, a cluster, a current/
superseded call. This task closes the loop on that: it turns
`trust_propagation.py`'s continuous scores into a triage queue of claims
worth a human's five seconds, stores what a human decides durably, and
feeds it back into future extraction — so `References & Trust` stops being
a one-way, read-only report and becomes a feedback signal.

| | |
|---|---|
| Module | `compiler/active_learning.py` |
| Correction store | `data/review_corrections.json` (created on first use; same human-editable-JSON pattern as `data/link_overrides.json` / `data/source_trust.json`) |
| Pipeline integration | `main.py --use-corrections` / `WIKI_USE_CORRECTIONS=true` |
| Tests | `compiler/tests/test_active_learning.py` |

## Selection: what's worth reviewing

`select_review_candidates()` takes one claim group plus its
`trust_propagation.propagate_group_trust()` output (never `gold_label` —
same discipline as tasks #2 and #7) and flags two kinds of claim:

- **Low confidence** — propagated score below `LOW_CONFIDENCE_THRESHOLD`
  (`0.35`).
- **Unresolved contradiction** — part of a `contradicts` edge where neither
  side's score clearly wins (within `CONTRADICTION_MARGIN`, `0.15`, of each
  other). A contradiction propagation has already confidently resolved
  (one side much higher than the other) isn't flagged — the whole point of
  task #2 was to resolve most of these automatically; only the genuinely
  ambiguous ones need a human.

**Real output on the pilot dataset** (`select_review_candidates_for_dataset`,
no API key needed — this runs entirely on task #2's deterministic
propagation):

```
nova_read_interval                       nri-1    low_confidence             score=0.07
nova_battery_cell_type                   nbc-3    unresolved_contradiction   score=0.26 vs nbc-4
nova_battery_cell_type                   nbc-4    unresolved_contradiction   score=0.35 vs nbc-3
nova_battery_cell_type                   nbc-6    unresolved_contradiction   score=0.35 vs nbc-3
nova_battery_life_claim                  nbl-4    unresolved_contradiction   score=0.33 vs nbl-5
nova_battery_life_claim                  nbl-5    unresolved_contradiction   score=0.33 vs nbl-4
nova_battery_life_claim                  nbl-2    unresolved_contradiction   score=0.54 vs nbl-1
nova_battery_life_claim                  nbl-1    unresolved_contradiction   score=0.54 vs nbl-2
teabuddy_herbal_preset_timing            thp-1    low_confidence             score=0.11
```

This lines up with what earlier tasks already found interesting about the
same claims — `nri-1` and `thp-1` are the superseded values tasks #2/#7
flagged as low-trust/non-current; `nbc-3`/`nbc-4`/`nbc-6` is the exact
CR2450/CR2032 cluster where task #7 found the `nbc-3` annotation gap
(surfacing a *third* time, independently, here — a claim genuinely worth
review keeps showing up worth review across differently-designed checks);
`nbl-*` is the scope-dependent battery-life cluster no single task expects
to fully resolve on its own. `meshsync_relay_battery_drain_root_cause` (the
deliberately dispute-free cluster) correctly produces zero candidates.

## The loop: correction storage and feedback

`Correction` records a human's verdict on a flagged claim
(`confirm_correct` / `confirm_incorrect` / `confirm_superseded` /
`confirm_scope_dependent`), a free-text note, and the claim's quote —
`correction_from_candidate()` builds one directly from a
`ReviewCandidate` so a caller never has to re-fetch the quote.
`save_correction()` appends to `data/review_corrections.json`,
deduplicating by claim id (a human revising their own earlier call
replaces it, not doubles it).

`render_fewshot_block()` turns the correction store into a few-shot block:

```
Known corrections from human review — apply the same judgment to similar text:
- "the old hourly claim" -> confirm_superseded: fixed in the 0.3.9 changelog
```

`synthesizer.extract_chunk_topics()` now accepts `extra_system_context`,
appended to `CHUNK_EXTRACTION_SYSTEM_PROMPT` when non-empty — this is
exactly where `render_fewshot_block()`'s output plugs in.
`main.py --use-corrections` (or `WIKI_USE_CORRECTIONS=true`) loads the
correction store once per compile and threads it through
`step_extract` → `extract_topics_from_raw_files` → every
`extract_chunk_topics` call for that run, same opt-in pattern as
`--critic-pass` (task #4) — off by default so it never silently changes
extraction behavior for existing users.

## What's demonstrated now vs. what's still a gap

**Demonstrated and tested without an API key:** candidate selection end to
end on the real pilot dataset; the correction store's save/load/dedupe
round trip; `render_fewshot_block()`'s output; and — via a fake LLM —
that `extract_chunk_topics()` actually includes the corrections block in
the system prompt it sends when one is provided, and leaves the prompt
unchanged when it isn't.

**Not yet built:** a dashboard surface for a human to actually browse
`select_review_candidates_for_dataset()`'s output and submit a
`Correction` by clicking, rather than calling `save_correction()`
programmatically — a "review queue" UI piece, not an algorithmic gap, and a
reasonable follow-up alongside wiring `select_review_candidates()` against
a *live compiled corpus* (via `resources_engine.py`'s deduped source list,
or a new adapter that builds a claim-group-shaped graph from real
`state.json` chunk extractions rather than only from
`trust_eval_dataset.json`'s pilot structure) instead of only the pilot
dataset shown above.

## Next

- [21](./21-trust-eval-dataset.md)–[23](./23-trust-propagation-evaluation.md) — the propagation scores this task's selection logic consumes
- [27-temporal-modeling.md](./27-temporal-modeling.md) — the other module that independently flagged the same `nbc-3` annotation gap this task's real-data run surfaces again
- [24-extraction-critic.md](./24-extraction-critic.md) — the other opt-in, few-shot-adjacent pipeline flag (`--critic-pass`), same "off by default, explicit opt-in" convention `--use-corrections` follows

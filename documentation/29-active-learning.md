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
| Dashboard | Two independent UIs on the same module: `/review` — `frontend/src/views/review.ejs` + `frontend/src/client/review.ts`, bridged via `compiler/cli.py`'s `review-candidates`/`review-corrections-list`/`review-correction-save` commands and `backend/src/routes/index.ts`'s `/api/review/*` routes; and `/review-queue` — `frontend/src/views/review-queue.ejs` + `frontend/src/client/review-queue.ts`, bridged via `review-queue`/`review-correct` and `/api/review-queue/*` |
| Tests | `compiler/tests/test_active_learning.py`, `compiler/tests/test_cli.py` |

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

**Now built: two independent review-queue dashboards**, both built on top of
`select_review_candidates_for_dataset()`/`save_correction()` and neither
aware of the other.

**Dashboard 1 — `/review-queue`.** `frontend/src/views/review-queue.ejs` +
`frontend/src/client/review-queue.ts` list the candidates and let a human
submit a `Correction` by clicking a verdict instead of calling
`save_correction()` programmatically, bridged via `compiler/cli.py`'s
`review-queue`/`review-correct` commands and `backend/src/routes/index.ts`'s
`/api/review-queue` + `/api/review-queue/correct` routes. See
[35-review-queue-ui.md](./35-review-queue-ui.md).

**Dashboard 2 — the review queue dashboard.** `/review` (`frontend/src/views/review.ejs`,
`frontend/src/client/review.ts`) browses `select_review_candidates_for_dataset()`'s
output and submits a `Correction` by clicking, instead of calling
`save_correction()` programmatically. Three routes on the Node backend
(`backend/src/routes/index.ts`) bridge to three new `compiler/cli.py`
subcommands, the same JSON-in/JSON-out pattern chat and email already use:

| Route | `cli.py` command | Does |
|-------|-------------------|------|
| `GET /api/review/candidates` | `review-candidates` | Runs `select_review_candidates_for_dataset()` against `trust_eval_dataset.json`, annotating each candidate with its saved `Correction` (if any) so already-reviewed claims show as resolved instead of being re-flagged forever |
| `GET /api/review/corrections` | `review-corrections-list` | Every saved `Correction`, unfiltered |
| `POST /api/review/corrections` | `review-correction-save` | Builds a `Correction` from `{claim_id, group_id, verdict, note, quote}` and calls `save_correction()` — same dedupe-by-`claim_id` behavior as the module itself |

The page shows stat tiles (flagged / pending / reviewed / contradictions),
filters by status and reason, and a per-candidate form (verdict dropdown +
free-text note) that posts straight to `save_correction()` — no separate
"apply" step. `compiler/tests/test_cli.py` covers the three new commands
directly (including the unknown-verdict rejection and the
correction-round-trips-into-the-next-candidates-call case) without going
through HTTP.

**Still a gap:** both dashboards wire the *review queue UI* against
`select_review_candidates_for_dataset()`, which itself still only runs on
`trust_eval_dataset.json`'s pilot structure — wiring `select_review_candidates()`
against a *live compiled corpus* (via `resources_engine.py`'s deduped source
list, or a new adapter that builds a claim-group-shaped graph from real
`state.json` chunk extractions) instead is not part of either task and
remains open. See [36-feature-roadmap.md](./36-feature-roadmap.md) for where
this ranks against other remaining gaps.

## Next

- [21](./21-trust-eval-dataset.md)–[23](./23-trust-propagation-evaluation.md) — the propagation scores this task's selection logic consumes
- [27-temporal-modeling.md](./27-temporal-modeling.md) — the other module that independently flagged the same `nbc-3` annotation gap this task's real-data run surfaces again
- [24-extraction-critic.md](./24-extraction-critic.md) — the other opt-in, few-shot-adjacent pipeline flag (`--critic-pass`), same "off by default, explicit opt-in" convention `--use-corrections` follows
- [35-review-queue-ui.md](./35-review-queue-ui.md) — the dashboard UI built on top of this module's `select_review_candidates_for_dataset()`/`save_correction()`
- [36-feature-roadmap.md](./36-feature-roadmap.md) — where the remaining "live corpus" gap ranks against other candidates

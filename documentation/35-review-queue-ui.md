# 35 — Review Queue UI

Closes the one piece [29-active-learning.md](./29-active-learning.md) named
as "not yet built": a dashboard surface for a human to actually browse
`active_learning.select_review_candidates_for_dataset()`'s output and
submit a `Correction` by clicking, instead of calling `save_correction()`
programmatically. The algorithm and storage were already real and tested;
this task is the missing UI, not a new algorithm.

| | |
|---|---|
| Route | `/review-queue` (frontend), gated behind login like every other dashboard page |
| Backend API | `GET /api/review-queue`, `POST /api/review-queue/correct` (`backend/src/routes/index.ts`) |
| CLI bridge | `compiler/cli.py` — `review-queue`, `review-correct` commands |
| View / client | `frontend/src/views/review-queue.ejs`, `frontend/src/client/review-queue.ts` |
| Tests | `compiler/tests/test_cli.py` (new) |

## What it does

The page runs `select_review_candidates_for_dataset()` against
`data/trust_eval_dataset.json` — the same pilot dataset
[23-trust-propagation-evaluation.md](./23-trust-propagation-evaluation.md)
and doc 29 evaluate against — and lists every flagged claim: its quote,
source path, reason (`low_confidence` or `unresolved_contradiction`, with
the other side of the contradiction named), and current propagated score.
Filters narrow to one reason or to "needs a verdict" (no correction saved
yet). Each row carries a form: pick a verdict
(`confirm_correct` / `confirm_incorrect` / `confirm_superseded` /
`confirm_scope_dependent`), add an optional note, submit. That calls
`POST /api/review-queue/correct`, which the backend bridges to
`cli.py review-correct` → `active_learning.save_correction()` →
`data/review_corrections.json` (gitignored, human-editable, same pattern as
`data/link_overrides.json`). Reloading the queue shows the recorded verdict
inline, and `--use-corrections` on the next compile turns it into a
few-shot example for extraction — the loop doc 29 described is now
actually closeable by clicking, not just by script.

## Out-of-date pages

A page can go stale without anything looking wrong: it reads fine, but a
source it was built from has since changed or been deleted, so its claims may
no longer match. The **needs attention** feed (this page, and the dashboard
summary) now flags those pages, the wiki list marks them with an amber dot,
and the page itself shows a banner naming the sources.

- **How a page is judged.** The sources a page was built from are on the
  page, in its *References & Trust* table (or the older *Sources* list).
  Each is compared with the checksum the compiler recorded in
  `data/state.json` when it processed the file:
  - different checksum → **changed** (severity medium);
  - file gone from `data/raw/` → **removed** (severity high);
  - a source the compiler has no record of is skipped: with nothing to
    compare against, nothing can be said.
- **Age is not a signal.** A page nothing has contradicted isn't wrong for
  being old, and "old" would flag the whole wiki after any pause.
- **The fix is a recompile.** The dashboard row's action is *Compile*.
  Compiles are incremental, so only pages whose sources changed are redone,
  and the compile report (doc 45) then lists exactly which ones.
- **Cost.** Checksums are cached by file size and modification time, so a
  source is re-read only after it changed on disk; the page list stays cheap
  for a big corpus. A page can't point the check outside `data/raw/`.

```
GET /api/attention              → counts.stale_pages, items with kind "stale_page"
GET /api/docs                   → each page has stale_sources (number of changed + removed)
GET /api/docs/<page>.md         → stale: {changed: [...], removed: [...]} | null
```

## What this does not change

- **Still scored against the pilot dataset, not a live compiled corpus.**
  Doc 29 named two follow-ups: this UI, and wiring
  `select_review_candidates()` against real `state.json` chunk extractions
  instead of only `trust_eval_dataset.json`'s pilot structure. This task is
  the first; the second is unchanged and still a real gap — see
  [documentation/36-feature-roadmap.md](./36-feature-roadmap.md) for where
  it ranks against other candidates.
- **No new selection logic.** `LOW_CONFIDENCE_THRESHOLD` /
  `CONTRADICTION_MARGIN` and the candidate-selection algorithm itself are
  untouched; this task only exposes what already existed.

## Next

- [29-active-learning.md](./29-active-learning.md) — the algorithm and
  correction store this UI drives
- [documentation/36-feature-roadmap.md](./36-feature-roadmap.md) — the R&D
  survey that identified this as the highest-value contained gap to close

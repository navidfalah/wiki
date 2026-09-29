# 48 — Scheduled Sync

Connectors (Gmail, Drive, IMAP, Postgres, SQLite; doc 34) used to import
only when someone clicked. **Scheduled sync** keeps the wiki current on its
own: every *N* hours, for each account you choose, it imports the newest
items into `data/raw/connectors/` and, if anything is new or changed, runs
an **incremental compile**, so only those files cost LLM calls.

It is off by default. Configure it in the admin panel (**Users → Scheduled
sync**, admins only).

## Settings

| Setting | Meaning |
|---|---|
| Sync automatically | Master switch. Nothing runs while it is off or no account is selected. |
| Every (hours) | 1–720. Counted from the *start* of the last run. |
| Compile after a sync that found something new | On by default. Uses the saved pipeline settings (Pipeline Architecture page): critic pass, PII redaction, excluded folders and the rest, exactly like a manual compile, but never `--force`. |
| Accounts | Any connected account. Per account: an optional search (e.g. a Gmail query) and how many of the newest items to look at (1–200, default 20). |

Settings live in `data/sync_settings.json`, run history (the last 20) in
`data/sync_state.json`. Both are per-install runtime state and gitignored,
like users and sessions; backups include them.

## What a run does

1. For each account, list up to *limit* items (`connectors-items-list`).
2. Import each one (`connectors-item-import`). The importer **leaves a file
   untouched when the item's text is unchanged** and reports
   `changed: false`. Before this, every import rewrote the file's
   "Imported at" header, which gave it a new checksum and made the compiler
   re-process it: a sync would have paid for the whole mailbox again every
   time.
3. If any item was new or changed and *compile after sync* is on, start an
   incremental compile and wait for it. The run appears on the Pipelines
   page like any other.
4. Record the run: per account, items listed / new or changed / unchanged /
   failed, the first errors, and the compile outcome.

Rules that keep it safe to leave running:

- **One failing account never stops the others.** A failed listing or item
  is recorded and skipped.
- **No retry storm.** A failed run is not retried before the next interval,
  so a broken connector isn't hit every few minutes. **Run now** retries at
  once.
- **A compile never waits behind someone's build.** If a build is already
  running, the compile is skipped (`busy`); the imported files are picked up
  by the next compile, since compiles are incremental.
- **One sync at a time.** A second **Run now** answers 409.
- The scheduler checks every 10 minutes (first check 2 minutes after boot)
  and survives restarts: the last run's time is on disk, so a restart does
  not trigger a sync.

Outcomes are also written to the Logs page ("Scheduled sync finished") and,
per account, to the connector activity log.

## API (admin)

```
GET  /api/admin/sync            → {settings, running, running_since, last_run, next_run_at, runs}
PUT  /api/admin/sync/settings   {enabled, interval_hours, compile_after_sync, connections:[{connector_id, account_label, query?, limit?}]}
POST /api/admin/sync/run        → 202 {started: true}   (runs in the background; poll GET)
```

## Cost

A sync with nothing new does no compile and no LLM call. A sync that finds
*n* new items costs what compiling *n* files costs. Keep *limit* modest
(newest items only) and use a search to narrow noisy mailboxes; the first
sync of a large mailbox will import up to *limit* items and compile them all.

## Files

- `backend/src/lib/syncScheduler.ts` — settings, runs, the scheduler.
- `backend/src/lib/pythonBridge.ts` — `runBuildHeadless()`, a build without
  an HTTP client that shares the SSE route's run tracking.
- `compiler/connectors_service.py` — `import_item` (idempotent).
- `frontend/src/client/lib/syncPanel.ts`, `views/users.ejs` — the admin panel.

## Limits

- Newest-first only: items older than the newest *limit* are never imported
  by the schedule (import them by hand from the Connectors page).
- Deletions upstream are not propagated: a file imported once stays in
  `data/raw/` until you remove it.
- A changed item is re-imported under the same file name, so its old
  version is overwritten (page history, doc 45, keeps earlier *wiki pages*).

## Next

- [34-external-connectors.md](./34-external-connectors.md)
- [40-production-deployment.md](./40-production-deployment.md)
- [12-api-server.md](./12-api-server.md)

# 45 — Page Version History

Every compile rewrites the wiki pages it relinks in place. Before this
feature there was no way to see what the LLM changed, or to undo a bad
compile or edit. Now every compiled page keeps its earlier versions. This
is task T8 in [43-project-assessment-and-roadmap.md](./43-project-assessment-and-roadmap.md).

## What gets saved

Before a page under `wiki-app/docs/` is replaced, its current content is
copied to:

```
data/page_history/<page-stem>/<YYYYMMDDTHHMMSSffffffZ>-<reason>.md
```

| Reason | Written by |
|---|---|
| `compile` | `compiler/linker.py`, before relinking a page (`page_history.snapshot`) |
| `delete` | `linker.py` when a topic disappears; the backend on *Delete* and *Delete all pages* |
| `edit` | backend `PUT /api/docs/*` (the wiki editor) |
| `restore` | backend, before restoring an older version |

- A snapshot is skipped when only the frontmatter's `last_updated` or
  `last_modified` lines would change. Every compile rewrites those, so
  without this rule every page would get a new version on every run.
- The newest 20 versions per page are kept.
- `data/page_history/` is runtime data, so it is gitignored. Back it up
  together with `data/`.
- The on-disk format is shared by `compiler/page_history.py` and
  `backend/src/lib/pageHistory.ts`, and a test checks that the backend reads
  versions the compiler wrote.

## Using it

On any wiki page, **History** opens `/wiki/<page>/history`, which shows:

- the list of versions;
- a line diff from the selected version to the current page. Unchanged runs
  are collapsed; red lines exist only in the saved version, green lines only
  in the current page;
- **Restore this version**, which first saves the current content as a
  `restore` version, so a restore can itself be undone.

A deleted page's history can still be opened, and restored, at the same URL.

## API

| Method | Path | |
|---|---|---|
| GET | `/api/doc-history/<page>.md` | `{page, versions: [{id, at, reason, size_bytes}]}`, newest first |
| GET | `/api/doc-history/<page>.md?version=<id>` | adds `content`, `current_exists`, and `diff` (lines `{op: ' '|'+'|'-', text}` or `{gap: n}`) |
| POST | `/api/doc-history/<page>.md` `{version}` | restore; logged in the activity log |

Page names must be flat `*.md` file names, and version ids must match the
stamp format, so neither can be used to reach outside the history
directory. Diffs larger than 4 million line pairs fall back to showing the
changed block as replaced, to keep them cheap.

## What changed in each compile

Page history answers "what happened to *this page*". The **compile report**
answers the other question: "what did *this run* do to the wiki?". It is
the check users need before trusting an LLM that rewrites pages.

Each build, manual or scheduled (doc 48), gets a report on the Pipelines
page: a one-line summary in the run list ("3 added · 5 changed · 1
removed") and, in the run's detail, every page it touched: added, changed
or removed, with line counts. A changed page links to its history, where
the exact diff is; a removed page shows struck through.

How it works, with no change to the compiler:

1. When a build starts, the backend records a manifest: a hash of every wiki
   page's content, **ignoring the `last_updated` / `last_modified` lines**
   (the compiler rewrites those on every relink, so without this every page
   would count as changed).
2. When the build ends, whether it succeeded, failed or was stopped, the
   pages on disk are compared with the manifest: new files are *added*,
   missing ones *removed*, differing hashes *changed*.
3. Line counts come from the snapshots above: `linker.py` saves a page's old
   content under the reason `compile` before rewriting it and `delete`
   before removing it. The report uses the newest such snapshot taken during
   the run (a later manual edit's snapshot is not mistaken for it), so the
   counts are exact. If no snapshot was kept, the counts are simply left out.

Reports are stored in `data/compile_reports/<run-id>.json` with an index of
totals; the newest 30 are kept, each capped at 500 listed pages (the totals
always count every page), and deleting a run deletes its report. Runs from
before reports existed show "No change report".

```
GET /api/pipelines              → runs, each with `changes: {added, changed, removed, unchanged} | null`
GET /api/pipelines/:id/changes  → {report: {run_id, started_at, finished_at, totals, pages, truncated} | null}
```

A page only counts as changed if its content differs *between the start and
the end of the run*, so a page rewritten twice to end up as it began is not
listed, and pages a person edits while a build is running are attributed to
the build. Files in `wiki-app/docs/` other than `*.md` pages are ignored.

## Not covered

- Pages rewritten by the maintenance scripts (`fix_dead_links.py`,
  `fix_frontmatter.py`, `fix_mdx_body.py`), and the generated index/MOC pages.
- There is no list of deleted pages yet. A deleted page's history is
  reachable only by its URL.

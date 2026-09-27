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

## Not covered

- Pages rewritten by the maintenance scripts (`fix_dead_links.py`,
  `fix_frontmatter.py`, `fix_mdx_body.py`), and the generated index/MOC pages.
- There is no list of deleted pages yet. A deleted page's history is
  reachable only by its URL.

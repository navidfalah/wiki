# 05 — Compiler Pipeline

Entry point: `compiler/main.py`  
Function: `run_pipeline(*, force=False)`

## Overview

The pipeline runs **five sequential steps**, then generates a **Map of Content (MOC)**.

```
Step 1  Data reading     → chunks
Step 2  Extraction       → state.json updated
Step 3  Synthesis        → temp_output/*.md drafts
Step 4  Indexing         → temp_output/index.json
Step 5  Cross-linking    → wiki-app/docs/*.md
+       Map of Content   → wiki-app/docs/index.md
```

Terminal output uses the `rich` library: step banners, progress bars, incremental status tables, final summary panel.

## CLI

```bash
python main.py                   # incremental
python main.py --force           # ignore MD5 cache
```

| Flag | Effect |
|------|--------|
| `--force` | Reprocess every raw file; regenerate all topics; full re-link |

Requires `OPENAI_API_KEY` — the pipeline calls `require_llm()` at start and exits `1`
immediately if it's unset. Exit code: `0` on success, `1` if no raw files found or the
LLM client can't be initialized.

## Step 1 — Data reading

**Module:** `synthesizer.py`  
**Functions:** `discover_raw_text_files()`, `read_raw_chunks()`, `split_text_into_chunks()`

| Detail | Value |
|--------|-------|
| Scanned extensions | `.txt`, `.md` only |
| Scan depth | Recursive under `data/raw/` |
| Chunk size | ~2000 characters max |
| Chunk boundary | Paragraph breaks (`\n\s*\n`) |
| Per-chunk metadata | `source_path`, `chunk_index`, `text` |

Displays a table of each raw file with MD5 prefix and size in KB.

## Step 2 — Extraction

**Module:** `synthesizer.py`  
**Function:** `extract_topics_from_raw_files()`

For each raw file (or only changed files unless `--force`):

1. Compute MD5 hash
2. Compare to `data/state.json` → `FileChangeSet`: new, modified, deleted, unchanged
3. Split file into chunks
4. Per chunk: extract `topics`, `entities`, `concepts`
5. Save to `state["files"][rel_path]` with `md5`, `chunks`, `processed_at`
6. Append run record to `state["runs"]`

See [06-extraction-and-synthesis.md](./06-extraction-and-synthesis.md) for extraction details.

## Step 3 — Synthesis

**Module:** `synthesizer.py`  
**Functions:** `group_chunks_by_topic()`, `synthesize_topic_wiki_pages()`

1. Group all chunks by extracted topic name
2. Determine **dirty topics** — topics whose source files changed (unless `--force`)
3. `cleanup_stale_drafts()` — remove draft `.md` files for topics no longer present
4. For each dirty topic (or all if `--force`): write `compiler/temp_output/{topic-slug}.md`

Output: draft markdown with YAML front matter (`id`, `title`, `tags`, `last_updated`).

## Step 4 — Indexing

**Module:** `linker.py`  
**Function:** `update_topic_index()` (incremental) or `build_topic_index()` (full)

Builds/updates `compiler/temp_output/index.json`:

```json
{
  "topics": {
    "MeshSync": "meshsync.md",
    "Battery": "battery.md"
  }
}
```

Maps **display title** → **filename** (not slug path). Used by linker for injection.

`IndexDelta` tracks `added`, `updated`, `removed` entries for incremental re-linking.

## Step 5 — Cross-linking

**Module:** `linker.py`  
**Function:** `link_and_export_pages()`

For each draft in `temp_output/` that needs re-linking:

1. Read draft body (strip existing front matter for linking pass)
2. Inject links via the LLM, matched against `index.json` titles
3. Apply `data/link_overrides.json` require/block rules
4. Sanitize for MDX (`mdx_sanitize.py`)
5. Wrap with Docusaurus front matter (`id`, `title`, `sidebar_label`, `slug`, `page_type`)
6. Write to `wiki-app/docs/{filename}`

Incremental: only pages in `dirty_filenames` or affected by `index_delta` are reprocessed.

## Map of Content (post-pipeline)

**Module:** `moc_generator.py`  
**Function:** `generate_moc(OUTPUT_DIR)`

Reads all exported pages in `wiki-app/docs/`, categorizes by:

- Folder (`entities/`, `concepts/`, `sources/`)
- Tag rules (`TAG_CATEGORY_RULES` in `moc_generator.py`)

Writes `wiki-app/docs/index.md` with hierarchical bullet lists and one-line summaries.

Skipped files: `index.md`, `.gitkeep`  
Meta tags excluded from categorization: `wiki`, `auto-ingest`, `llm-ingest`, `index`, `moc`, `overview`

## Incremental behavior summary

| Step | Incremental trigger |
|------|---------------------|
| 2 | MD5 change in `data/state.json` |
| 3 | Source file new/modified/deleted → affected topics |
| 4 | New/changed/removed draft filenames |
| 5 | Dirty drafts + pages linking to changed/removed topics |

## build_wiki.sh integration

`build_wiki.sh` at repo root:

1. Ensures `compiler/.venv`
2. Runs `python compiler/main.py "$@"` (forwards `--force`)
3. Runs `npm run build` in `wiki-app/`

Aborts Docusaurus build if compiler exits non-zero.

## Live compile (dashboard)

`/api/build/stream` spawns the same `main.py` via `build_runner.py`:

- Query params: `force` (default `false`, forwarded to `main.py` as `--force`) and
  `timeout_seconds` (optional override for the run's time limit)
- Requires `OPENAI_API_KEY` in the server's environment; `main.py` exits `1` immediately otherwise
- Streams SSE events: `start`, `log`, `done`, `error`
- Only one build at a time (`409` if lock held)
- Strips ANSI escape codes from Rich output before streaming
- **Timed out builds:** the run is killed (SIGTERM, then SIGKILL after a 10s grace
  period) if it exceeds `DEFAULT_BUILD_TIMEOUT_SECONDS` (1800s / 30 min), or the
  `COMPILER_BUILD_TIMEOUT_SECONDS` env var / `timeout_seconds` query param when set.
  A timeout yields an `error` event followed by `done` with `success: false` and
  `code: -1`, so a stuck LLM call or hung subprocess can't hold `_build_lock`
  forever and block every future build.

## Next

- [06-extraction-and-synthesis.md](./06-extraction-and-synthesis.md)
- [07-linking-moc-and-pages.md](./07-linking-moc-and-pages.md)

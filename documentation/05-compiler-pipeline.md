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
| `--web-search` | Step 3 also searches the internet per dirty topic and adds hits as extra `source_type="web"` chunks — off by default, see [37-web-search-enrichment.md](./37-web-search-enrichment.md) |

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
3. If `--web-search` is on: search the internet for each dirty topic (all topics if `--force`) and append the hits as extra `source_type="web"` chunk entries (`main.py`'s `step_synthesize()` → `web_search.augment_grouped_with_web_results()`) — see [37-web-search-enrichment.md](./37-web-search-enrichment.md)
4. `cleanup_stale_drafts()` — remove draft `.md` files for topics no longer present
5. For each dirty topic (or all if `--force`): write `compiler/temp_output/{topic-slug}.md`

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
- Only one build at a time — the route acquires `_build_lock` synchronously before
  returning the `StreamingResponse` (not lazily inside the generator), so two
  concurrent requests can't both slip past the "already running" check; the loser
  gets `409`
- `POST /api/build/stop` kills the in-flight build on demand (`{"stopped": bool}`);
  the running stream reports it as `done` with `success: false` and
  `"message": "Build stopped by user."` and releases the lock itself
- Strips ANSI escape codes from Rich output before streaming

### Failure handling

Every exit path — clean finish, non-zero exit, timeout, user stop, failure to
spawn, the client disconnecting, or a bug in `build_runner.py` itself — ends in
exactly one `done` event and always kills the subprocess and clears its
module-level slot, so a broken run can never wedge `_build_lock` or leave an
orphaned process running:

| Cause | `error.kind` | `done.success` |
|-------|--------------|-----------------|
| Entrypoint missing | `missing_entrypoint` | `false` |
| `main.py` fails to spawn (OS error) | `spawn_failed` | `false` |
| Subprocess has no stdout pipe | `no_stdout` | `false` |
| Exceeds the timeout | `timeout` | `false` |
| Finishes output but won't exit within the grace period | `exit_wait_timeout` | `false` |
| Unhandled exception in `build_runner.py` | `unexpected` | `false` |
| `POST /api/build/stop` called | *(no error event)* | `false` |
| Client disconnects mid-stream | *(no event — generator is cancelled)* | — |
| Normal non-zero exit code | *(no error event, just `done`)* | `false` |

**Timed out builds:** killed (SIGTERM, then SIGKILL after a 10s grace period) if
the run exceeds `DEFAULT_BUILD_TIMEOUT_SECONDS` (1800s / 30 min), or the
`COMPILER_BUILD_TIMEOUT_SECONDS` env var / `timeout_seconds` query param when set.

**Client disconnect:** if the SSE connection drops (browser closed, network
hiccup), FastAPI cancels the generator; `stream_compiler_build` catches the
resulting `CancelledError`, kills the subprocess, and re-raises — no zombie
process is left running against a closed pipe.

## Next

- [06-extraction-and-synthesis.md](./06-extraction-and-synthesis.md)
- [07-linking-moc-and-pages.md](./07-linking-moc-and-pages.md)

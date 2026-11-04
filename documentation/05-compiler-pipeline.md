# 05 — Compiler Pipeline

> Current behavior: linking uses Python only. Chat defaults to local keyword search and source excerpts. See [42 — Minimal AI](./42-minimal-ai.md) for the simplified workflow and migration of older settings.

The legacy Python build lives in **`compiler/pipeline/`**, with one module per stage, a runner, reporting, and command-line parsing. See the [JavaScript runtime guide](44-javascript-runtime-migration.md) for the current application compiler.

Entry point: `compiler/main.js`  
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
node compiler/main.js            # incremental
node compiler/main.js --force    # ignore MD5 cache
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
3. If `--web-search` is on: search the internet for each dirty topic (all topics if `--force`) and append the hits as extra `source_type="web"` chunk entries (`main.js`'s `step_synthesize()` → `web_search.augment_grouped_with_web_results()`) — see [37-web-search-enrichment.md](./37-web-search-enrichment.md)
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

## build_wiki.js integration

`build_wiki.js` at repo root:

1. Builds the JavaScript backend
2. Runs `node compiler/main.js` (forwards `--force`)
3. Builds the frontend

Aborts the frontend build if compilation fails.

## Live compile (dashboard)

`/api/build/stream` runs the JavaScript compiler through `buildService.ts`:

- The `force` query parameter controls whether unchanged sources are reprocessed.
- Compilation requires a configured model API key.
- Progress is streamed using SSE events including `start`, `log` and `done`.
- Only one build runs at a time, and one further request may wait in the queue; another request receives HTTP 409.
- `POST /api/build/stop` requests cancellation and the stream reports the stopped build.

### Failure handling

The build service records errors or cancellation in run history and releases the build slot. An interrupted server run is marked as abandoned when the backend restarts. A disconnected client does not by itself stop an active build.

## Next

- [06-extraction-and-synthesis.md](./06-extraction-and-synthesis.md)
- [07-linking-moc-and-pages.md](./07-linking-moc-and-pages.md)

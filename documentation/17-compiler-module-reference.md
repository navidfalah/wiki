# 17 — Compiler Module Reference

Every Python module in `compiler/` with responsibilities and key entry points.

## Orchestration

### `main.py`

| Symbol | Role |
|--------|------|
| `run_pipeline(use_llm, force)` | Full 5-step pipeline + MOC |
| `step_read_data()` | Step 1 |
| `step_extract()` | Step 2 |
| `step_synthesize()` | Step 3 |
| `step_index()` | Step 4 |
| `step_link()` | Step 5 |
| `main()` | CLI argparse |

## Core pipeline

### `synthesizer.py`

| Symbol | Role |
|--------|------|
| `discover_raw_source_files()` | Find every recognized source under raw dir (text/email/image/file) |
| `_chunks_for_file()` | Dispatch by extension to text chunking / `email_ingest` / `media_ingest` |
| `read_raw_chunks()` | All files → `RawChunk` list (needs `llm` if images present) |
| `extract_chunk_topics()` | Per-chunk LLM extraction (same prompt regardless of `source_type`) |
| `extract_topics_from_raw_files()` | Step 2 with MD5 incremental |
| `group_chunks_by_topic()` | Topic → chunk list map (carries `source_type`) |
| `synthesize_topic_wiki_pages()` | Write drafts to `temp_output/`, appends References & Trust |
| `compute_file_md5()` | File hash for state |
| `load_state()` / `save_state()` | `data/state.json` |
| `scan_raw_file_changes()` | `FileChangeSet` |
| `slugify()` | URL-safe slugs |
| `RawChunk` / `ChunkExtraction` | `source_type: "text" \| "email" \| "image" \| "file"` |

### `text_chunking.py`

`split_text_into_chunks()` — paragraph-based chunking shared by
`synthesizer.py`, `media_ingest.py`, and `email_ingest.py` (kept in its own
stdlib-only module so those don't have to import `synthesizer.py`).

### `media_ingest.py`

| Symbol | Role |
|--------|------|
| `build_image_chunk()` | Vision-caption an image → chunk dict, copies file to `static/media/` |
| `build_audio_chunk()` | Transcribe audio → chunk dict, copies file to `static/media/`; degrades to metadata-only without an LLM or on transcription failure |
| `build_file_chunks()` | PDF/CSV/TSV/JSON/XML/HTML/YAML/log text extraction, or opaque attachment for other types |
| `copy_media_to_static()` / `copy_bytes_to_static()` | Content-hash-deduped copy into `wiki-app/static/media/` |
| `docs_relative_media_link()` | Build a `../static/media/...` link from a docs page |
| `IMAGE_EXTENSIONS`, `AUDIO_EXTENSIONS`, `TEXT_EXTRACTABLE_FILE_EXTENSIONS`, `OPAQUE_FILE_EXTENSIONS` | Recognized extension sets |

### `email_ingest.py`

| Symbol | Role |
|--------|------|
| `parse_eml()` | Parse one `.eml` → `ParsedEmail` (headers, body, attachments) |
| `build_email_chunks()` | `ParsedEmail` → chunk dict(s), saves attachments via `media_ingest` |
| `EMAIL_EXTENSIONS` | `{".eml"}` |

### `trust.py`

| Symbol | Role |
|--------|------|
| `resolve_trust()` | Glob rules (from `data/source_trust.json`) → source-type default → `TrustInfo` |
| `build_references()` | Dedupe a topic's chunk entries → numbered `ReferenceEntry` list |
| `render_references_markdown()` | Deterministic `## References & Trust` table |
| `load_trust_config()` / `save_trust_config()` | Read/write `data/source_trust.json` |
| `TRUST_LEVELS` | `unverified < low < medium < high < verified` |

### `linker.py`

| Symbol | Role |
|--------|------|
| `build_topic_index()` | Full index rebuild |
| `update_topic_index()` | Incremental index update |
| `load_topic_index()` | Read `index.json` |
| `link_page_with_llm()` | LLM link injection |
| `link_and_export_pages()` | Step 5 export to `wiki-app/docs/` |
| `wrap_docusaurus_doc()` | Front matter wrapper |
| `IndexDelta` | Tracks index add/update/remove |

### `moc_generator.py`

| Symbol | Role |
|--------|------|
| `generate_moc()` | Write `wiki-app/docs/index.md` |
| `TAG_CATEGORY_RULES` | Tag → sidebar category mapping |
| `FOLDER_CATEGORIES` | entities/concepts/sources labels |

## LLM and quality

### `llm_client.py`

| Symbol | Role |
|--------|------|
| `LLMClient` | OpenAI SDK wrapper |
| `ResponseCache` | SQLite `data/.llm-cache.sqlite` |
| `make_cache_key()` / `make_image_cache_key()` / `make_audio_cache_key()` | SHA256 cache key (text prompt / image content hash / audio content hash) |
| `generate_response()` | Chat completion + retry |
| `describe_image()` | Vision-capable chat completion (image captioning) + retry |
| `transcribe_audio()` | Speech-to-text completion (audio transcription, model `OPENAI_TRANSCRIPTION_MODEL`) + retry |
| `complete_json()` | JSON parse helper |

### `reviewer.py`

| Symbol | Role |
|--------|------|
| `review_pages()` | LLM quality review vs raw chunks |
| Output | `compiler/review_report.txt` |

## Linking and overrides

### `link_overrides.py`

| Symbol | Role |
|--------|------|
| `load_link_overrides()` | Read `data/link_overrides.json` |
| `save_link_overrides()` | Write with `updated_at` |
| `validate_connections()` | Filter invalid topic pairs |
| `apply_connection_overrides()` | require/block on page body |
| `build_knowledge_graph_payload()` | API graph structure |
| `detect_topic_links()` | Parse markdown links → topics |

## API and builds

### `server.py`

FastAPI app — all `/api/*` routes. See [12-api-server.md](./12-api-server.md).

### `build_runner.py`

| Symbol | Role |
|--------|------|
| `stream_compiler_build()` | Async SSE generator for `main.py` subprocess |
| `strip_ansi()` | Remove Rich color codes from logs |
| `sse_event()` | Format SSE `data:` lines |

## Analytics

### `analytics.py`

| Symbol | Role |
|--------|------|
| `build_analytics()` | Full metrics payload for API |
| `get_tag_detail()` | Per-tag chunk + page drill-down |

### `dead_link_checker.py`

| Symbol | Role |
|--------|------|
| `find_broken_links()` | Scan docs for missing link targets |

## Utilities

### `models.py`

Path constants: `PROJECT_ROOT`, `RAW_DIR`, `OUTPUT_DIR`, `STATE_FILE`

### `yaml_frontmatter.py`

`yaml_quote()` — safe quoting for YAML scalar values

### `mdx_sanitize.py`

`sanitize_for_mdx()` — escape/sanitize body for Docusaurus MDX

### `fix_frontmatter.py`

CLI to re-quote broken front matter fields in `wiki-app/docs/`

### `fix_mdx_body.py`

MDX body repair utility

## Test data generators (`scripts/dev/`)

Dev-only — not imported by the compiler pipeline. See
[09-test-data-generation.md](./09-test-data-generation.md).

| Module | Function |
|--------|----------|
| `generate_dummy_data.py` | Dispatcher CLI: `python generate_dummy_data.py <junk\|bulk\|extended\|varied\|keep-aurora>` |
| `generate_junk_data.py` | `generate_junk_data()` — 10 seed files |
| `generate_bulk_dummy_data.py` | `generate_bulk_dummy_data()`, `generate_procedural_dummy_test_data()` |
| `generate_varied_dummy_data.py` | `generate_varied_dummy_data()` |
| `generate_extended_dummy_data.py` | Extended wave-2 file dict |
| `keep_aurora_raw.py` | Archive non-Aurora raw files to `data/_archive_non_aurora/` |

## Shell scripts

| Script | Role |
|--------|------|
| `run_server.sh` | venv + `python server.py` |

## Repo root scripts

| Script | Role |
|--------|------|
| `build_wiki.sh` | venv + compile + `npm run build` |

## Next

- [05-compiler-pipeline.md](./05-compiler-pipeline.md)
- [09-test-data-generation.md](./09-test-data-generation.md)
- [19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md)

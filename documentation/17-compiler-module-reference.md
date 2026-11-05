# 17 — Compiler Module Reference

Current JavaScript compiler entry points and historical Python module references.

## Orchestration

### `main.js`

| Symbol | Role |
|--------|------|
| `compile()` | Reads sources, extracts topics, synthesizes pages, links and writes output |
| CLI options | See `node compiler/main.js --help` |

## Core pipeline

### Former `synthesizer.py` workflow → `backend/src/lib/compilerEngine.js`

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

### `backend/src/lib/textChunking.js`

`splitTextIntoChunks()` — paragraph-based chunking used by the active compiler.

### Former `media_ingest.py` workflow → `backend/src/lib/sourceReader.js` and `compilerEngine.js`

| Symbol | Role |
|--------|------|
| `build_image_chunk()` | Vision-caption an image → chunk dict, copies file to `static/media/` |
| `build_audio_chunk()` | Transcribe audio → chunk dict, copies file to `static/media/`; degrades to metadata-only without an LLM or on transcription failure |
| `build_file_chunks()` | PDF/DOCX/XLSX/PPTX/CSV/TSV/JSON/XML/HTML/YAML/log/ZIP text (or ZIP file-listing) extraction, or opaque attachment for other types |
| `_extract_pdf_text()` / `_extract_docx_text()` / `_extract_xlsx_text()` / `_extract_pptx_text()` | Per-format extractors — each returns `None` (→ opaque fallback) if its library isn't usable or the file fails to parse |
| `_extract_zip_manifest()` | ZIP entry names + sizes via stdlib `zipfile` — a listing, not recursive extraction |
| `copy_media_to_static()` / `copy_bytes_to_static()` | Content-hash-deduped copy into `wiki-app/static/media/` |
| `docs_relative_media_link()` | Build a `../static/media/...` link from a docs page |
| `IMAGE_EXTENSIONS`, `AUDIO_EXTENSIONS`, `TEXT_EXTRACTABLE_FILE_EXTENSIONS`, `OPAQUE_FILE_EXTENSIONS` | Recognized extension sets |

### `email_ingest.py`

| Symbol | Role |
|--------|------|
| `parse_eml()` | Parse one `.eml` → `ParsedEmail` (headers, body, attachments) |
| `build_email_chunks()` | `ParsedEmail` → chunk dict(s), saves attachments via `media_ingest` |
| `EMAIL_EXTENSIONS` | `{".eml"}` |

### `backend/src/lib/trust.js`

| Symbol | Role |
|--------|------|
| `resolve_trust()` | Glob rules (from `data/source_trust.json`) → source-type default → `TrustInfo` |
| `build_references()` | Dedupe a topic's chunk entries → numbered `ReferenceEntry` list |
| `render_references_markdown()` | Deterministic `## References & Trust` table |
| `load_trust_config()` / `save_trust_config()` | Read/write `data/source_trust.json` |
| `TRUST_LEVELS` | `unverified < low < medium < high < verified` |

### JavaScript compiler and linking

The former Python linker was removed. The active compiler uses exact-title
linking and manual overrides through `backend/src/lib/compilerEngine.js` and
`backend/src/lib/linkOverrides.ts`.

The compiler's internal `applyOverrides()` helper applies require/block rules
while generating each page.

### `compiler/moc_generator.js`

| Symbol | Role |
|--------|------|
| `generateMoc()` | Write `wiki-app/docs/index.md` |
| Dynamic tag categories | Derive sidebar groups from page tags |
| Folder categories | Group entity/concept/source pages |

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

### `reviewer.js`

| Symbol | Role |
|--------|------|
| `review_pages()` | LLM quality review vs raw chunks |
| Output | `compiler/review_report.txt` |

## Linking and overrides

### `backend/src/lib/linkOverrides.ts`

| Symbol | Role |
|--------|------|
| `loadLinkOverrides()` / `saveLinkOverrides()` | Read/write `data/link_overrides.json` |
| `validateConnections()` | Filter invalid topic pairs |
| `buildKnowledgeGraphPayload()` | Build API graph structure |
| `detectTopicLinks()` | Parse Markdown links into topic relations |

## API and builds

### `backend/src/lib/buildService.ts`

| Symbol | Role |
|--------|------|
| `streamCompilerBuild()` | Runs the shared JavaScript compiler and streams progress as SSE |

## Analytics

### JavaScript analytics

| Symbol | Role |
|--------|------|
Analytics API behavior now lives in `backend/src/lib/analytics.js` and Express routes.

### `dead_link_checker.py`

| Symbol | Role |
|--------|------|
| `find_broken_links()` | Scan docs for missing link targets |

## Utilities

### `models.py`

Path constants: `PROJECT_ROOT`, `RAW_DIR`, `OUTPUT_DIR`, `STATE_FILE`

### `backend/src/lib/yamlFrontmatter.js`

`yaml_quote()` — safe quoting for YAML scalar values

### `compiler/mdx_sanitize.js`

`sanitizeForMdx()` — escape/sanitize the generated Markdown body

### `fix_frontmatter.js`

CLI to re-quote broken front matter fields in `wiki-app/docs/`

### `fix_mdx_body.js`

MDX body repair utility

## Test data generators

The former Python generators are retired. See
[09-test-data-generation.md](./09-test-data-generation.md).

## Repo root scripts

| Script | Role |
|--------|------|
| `build_wiki.js` | JavaScript compile + backend/frontend builds |

## Next

- [05-compiler-pipeline.md](./05-compiler-pipeline.md)
- [09-test-data-generation.md](./09-test-data-generation.md)
- [19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md)

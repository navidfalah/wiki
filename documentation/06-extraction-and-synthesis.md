# 06 — Extraction and Synthesis

How raw text becomes structured extractions and draft wiki pages.  
**Module:** `compiler/synthesizer.py`

## Chunking

### Discovery

```python
discover_raw_source_files(RAW_DIR)  # every recognized extension, not just text
```

Returns sorted unique paths across text, email, image, and file-attachment
extensions (see [19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md)
for the full extension list). Symlinks follow normal filesystem behavior.

### Split algorithm (text)

`split_text_into_chunks(content, max_chars=2000)` — now in `text_chunking.py`,
shared with `media_ingest.py` and `email_ingest.py`:

1. Split on blank lines → paragraphs
2. Accumulate paragraphs until adding the next would exceed 2000 chars
3. Emit chunk; start new chunk with overflow paragraph
4. Empty file → no chunks (file skipped in practice if empty)

**Implication:** A 12 KB varied-sample PRD becomes 6–8 chunks. A 31-line forum scrape is usually 1 chunk.

### Non-text sources

`.eml`, image, and file-attachment sources don't go through
`split_text_into_chunks` directly on their raw bytes — `_chunks_for_file()`
dispatches them to `email_ingest.build_email_chunks()` or
`media_ingest.build_image_chunk()` / `build_file_chunks()` first, which
produce ordinary chunk text (an email's headers+body, an image's caption, a
PDF's extracted text) that *those* functions then paragraph-chunk the same
way if it's long. See [19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md).

### RawChunk structure

```python
@dataclass
class RawChunk:
    source_path: str   # e.g. "bulk/[DUMMY-TEST-DATA]-aurora-..."
    chunk_index: int   # 0-based per file
    text: str
    source_type: str = "text"   # "text" | "email" | "image" | "file"
```

## Extraction (Step 2)

### Output per chunk (`ChunkExtraction`)

```python
topics: list[str]       # e.g. ["Summary", "MeshSync"]
entities: list[dict]    # {"name": "Mira Chen", "description": "..."}
concepts: list[dict]    # {"name": "Battery", "description": "..."}
```

Stored in `data/state.json` under `files[rel_path].chunks[]`.

### Heuristic extraction (removed)

Earlier versions of the compiler fell back to rule-based extraction (header/bold-term
scraping) when no API key was set. That path has been removed — extraction is now
LLM-only. See [08-llm-and-heuristics.md](./08-llm-and-heuristics.md).

### LLM extraction

- System prompt: `CHUNK_EXTRACTION_SYSTEM_PROMPT` (in `synthesizer.py`)
- Input: source path, chunk index, chunk text (truncated to 8000 chars)
- Output: JSON with `topics`, `entities`, `concepts`
- Parsed via `_parse_extraction_json()` — extracts first `{...}` block from response

### State persistence

After extraction, each file entry in `state.json`:

```json
{
  "md5": "abc123...",
  "chunks": [
    {
      "chunk_index": 0,
      "text": "...",
      "topics": ["MeshSync"],
      "entities": [{"name": "Mira Chen", "description": "..."}],
      "concepts": []
    }
  ],
  "processed_at": "2026-05-31T19:06:43.979055+00:00"
}
```

`state["runs"]` appends metadata: `new`, `modified`, `deleted`, `unchanged`, `skipped`, `force`, `at`.

## Grouping by topic (Step 3 prep)

`group_chunks_by_topic(extractions)`:

- Iterates all files → all chunks → all topics
- Same topic from different files/chunks → single list entry
- Each entry: `{source, chunk_index, text, entities, concepts}`
- Sorted alphabetically by topic name
- Chunks with no topics → bucket `"General Notes"`

## Synthesis (Step 3)

### Output location

`compiler/temp_output/{slugify(topic)}.md`

Example: topic `"MeshSync"` → `meshsync.md`

### Dirty topic logic

| Condition | `dirty_topics` |
|-----------|----------------|
| `--force` | `None` (regenerate all) |
| Changed sources exist | Set of topics touching those sources |
| No changes | Empty set (skip synthesis) |

`topics_affected_by_sources()` maps changed file paths → topic names via grouped index.

### Heuristic topic page (removed)

The rule-based topic-page template (`_heuristic_topic_page`) was removed along with
heuristic extraction. All topic pages are now LLM-synthesized.

### LLM topic page

Prompt includes:

- Topic name, suggested id, tags, timestamp
- All chunk blocks: `### Source: path (chunk N, type: text|email|image|file)` + full text

System prompt: `WIKI_PAGE_SYSTEM_PROMPT` — asks for markdown with front matter,
and explicitly tells the model **not** to write its own Sources/References
section. After the response comes back, `synthesize_topic_wiki_pages()`
strips any such section the model wrote anyway (safety net) and appends a
deterministic `## References & Trust` table built from `trust.py` — see
[19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md).

### Legacy per-file synthesis (removed)

The compiler previously supported a per-raw-file path that wrote `sources/`, `entities/`, and `concepts/` pages. That path has been removed; `main.py` uses **topic-based** synthesis only.

## Slugify

```python
slugify(text)  # lowercase, strip punctuation, spaces → hyphens, max 80 chars
```

Used for filenames, doc ids, and tag normalization.

## Helper utilities

| Function | Purpose |
|----------|---------|
| `compute_file_md5(path)` | 8 KB block reads, hex digest |
| `load_state()` / `save_state()` | Read/write `data/state.json` |
| `scan_raw_file_changes()` | MD5 diff → `FileChangeSet` |
| `cleanup_stale_drafts()` | Delete `temp_output/*.md` not in active topic set |
| `build_docusaurus_frontmatter()` | YAML block for drafts |

## Next

- [07-linking-moc-and-pages.md](./07-linking-moc-and-pages.md)
- [08-llm-and-heuristics.md](./08-llm-and-heuristics.md)

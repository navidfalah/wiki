# 10 — Data Layout and State

Everything under `data/` and intermediate compiler output.

## `data/raw/` — compiler input

The only directory humans routinely add files to. Recursively scanned for
`.txt`/`.md` (text), `.eml` (email), images, and PDF/CSV/JSON/DOCX/XLSX/PPTX/ZIP
(file attachments) — see
[19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md) for
how each non-text type is handled.

### Typical subfolders (this repo)

| Subfolder | Origin | Notes |
|-----------|--------|-------|
| `notes/` | junk + procedural | Standups, scribbles |
| `transcripts/` | junk + procedural | Meeting/support transcripts |
| `articles/` | junk + samples | Spec fragments, blog scrapes |
| `ideas/` | junk + samples | Brainstorms |
| `emails/` | procedural + extended | Email threads |
| `specs/` | procedural + extended | Product/hardware specs |
| `research/` | extended | Competitive research |
| `dummy-test/` | extended + procedural | Labeled ops docs |
| `bulk/` | procedural | High-volume generator output |
| `samples/` | bulk + extended | `[SAMPLE]` curated narratives |
| `varied-samples/` | varied generator | Large multi-type files |

Subfolder name does **not** change compiler behavior — only organization for humans.

### Adding your own content

1. Create any subfolder under `data/raw/`
2. Add `.md` or `.txt`
3. Run `python main.py` from `compiler/`
4. No registration step — discovery is automatic

## `data/state.json` — incremental compiler state

**Created on:** first successful compile  
**Gitignored:** yes  
**Used by:** `synthesizer.py`, `server.py`, `analytics.py`, `reviewer.py`

### Schema

```json
{
  "version": 1,
  "files": {
    "notes/my-file.md": {
      "md5": "hex digest",
      "chunks": [
        {
          "chunk_index": 0,
          "text": "full chunk text...",
          "topics": ["Topic A"],
          "entities": [{"name": "...", "description": "..."}],
          "concepts": []
        }
      ],
      "processed_at": "ISO-8601 UTC"
    }
  },
  "runs": [
    {
      "at": "ISO-8601",
      "new": [],
      "modified": ["path"],
      "deleted": [],
      "unchanged": ["path"],
      "skipped": 0,
      "force": false
    }
  ]
}
```

### Operations

| Action | Effect on state |
|--------|-----------------|
| New raw file | Added to `files` on next compile |
| Edit raw file | MD5 changes → re-extract, dirty topics |
| Delete raw file | Removed from `files`; stale drafts cleaned |
| `--force` | Re-extract all regardless of MD5 |
| Delete `state.json` | Full rebuild on next compile (state recreated) |

## `data/.compiler-state.json` — removed

This legacy snapshot file is no longer used. Incremental state lives in `data/state.json`.

Older format mapping processed files → page slugs. **Not read by current `main.py`.** Safe to ignore or delete.

Example structure:

```json
{
  "processed": {
    "articles/foo.md": {
      "mtime": 1780254225.62,
      "pages": ["sources/foo", "entities/bar"],
      "at": "2026-05-31T..."
    }
  },
  "runs": [...]
}
```

## `data/link_overrides.json`

Manual graph connection rules. See [07-linking-moc-and-pages.md](./07-linking-moc-and-pages.md).

Default when missing:

```json
{
  "version": 1,
  "connections": []
}
```

`updated_at` added on save.

## `data/.llm-cache.sqlite`

SQLite cache for LLM responses. Created when first API call succeeds in LLM mode. Safe to delete to force fresh API calls.

## `compiler/temp_output/` — drafts

| File | Purpose |
|------|---------|
| `*.md` | Unlinked (or partially linked) topic draft pages |
| `index.json` | Topic title → filename map |
| `extractions.json` | Optional debug dump from `run_topic_synthesis_pipeline()` |

**Not served by Docusaurus.** Browsing uses `wiki-app/docs/` only.

Draft filenames: `{slugify(topic)}.md` — flat, no subfolders in current pipeline.

## `wiki-app/docs/` — final wiki

| Content | Description |
|---------|-------------|
| `index.md` | Auto-generated Map of Content |
| `*.md` | Flat topic pages (current pipeline) |
| `entities/`, `concepts/`, `sources/` | May exist from older compiles or manual work |

Each page: YAML front matter + markdown body with `./relative.md` links.

**Regenerated** on compile for pages the linker touches. Manual edits may be overwritten — refine after compile or exclude from dirty sets by not recompiling.

## Size expectations (this repo)

With full test data generation:

- `data/raw/` — 1000+ files possible
- `wiki-app/docs/` — 200+ pages typical after compile
- Compile time — minutes with full corpus; seconds incremental with small changes

## Next

- [05-compiler-pipeline.md](./05-compiler-pipeline.md)
- [12-api-server.md](./12-api-server.md) — how API reads state

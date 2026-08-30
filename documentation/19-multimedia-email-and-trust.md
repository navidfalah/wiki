# 19 — Multimedia, Email, and Trust/References

Three additions on top of the core 5-step pipeline, each its own module:

| Concern | Module | Source types it adds |
|---------|--------|----------------------|
| Images & file attachments | `media_ingest.py` | `image`, `file` |
| Email | `email_ingest.py` | `email` |
| Source trust + citations | `trust.py` | (applies to every source type) |

All three plug into the **existing** extraction/synthesis/linking pipeline —
there's no separate pipeline for non-text sources. See
[05-compiler-pipeline.md](./05-compiler-pipeline.md) for the base pipeline
this extends.

## How a non-text source becomes a wiki page

The key design choice: **every source type is converted to a text chunk as
early as possible**, then flows through the exact same LLM extraction →
grouping → synthesis → linking steps as a plain `.txt`/`.md` note. Nothing
downstream of chunk creation needs to know or care whether a chunk originated
from a note, an email, an image caption, or an extracted PDF page.

```
data/raw/photo.png  ──┐
data/raw/thread.eml ──┼──▶ RawChunk(text=..., source_type=...) ──▶ same extraction/
data/raw/spec.pdf   ──┘                                            synthesis/linking
data/raw/notes.md   ──────────────────────────────────────────────▶ pipeline as before
```

`synthesizer.py`'s `_chunks_for_file()` is the dispatch point — it looks at
the file extension and delegates:

| Extension(s) | Handler | What the chunk text becomes |
|---|---|---|
| `.txt`, `.md` | `synthesizer.py` (unchanged) | The file's own text, paragraph-chunked |
| `.eml` | `email_ingest.build_email_chunks()` | Headers block + body text + attachment links |
| `.png .jpg .jpeg .gif .webp .bmp` | `media_ingest.build_image_chunk()` | An LLM-generated caption + embedded `![...](...)` |
| `.pdf .csv .json` | `media_ingest.build_file_chunks()` | Extracted text (PDF via `pypdf`, CSV/JSON via stdlib) |
| `.docx .xlsx .pptx .zip` | `media_ingest.build_file_chunks()` | Metadata + a `[Download ...](...)` link — no content parsing |

`discover_raw_source_files()` (renamed from `discover_raw_text_files()`) now
walks all of `data/raw/` and keeps any file whose extension is in one of
these sets, so every source type participates in the same MD5-based
incremental compile as plain text files — a new image only gets captioned
(an API call) once, and is skipped on every later compile until it changes.

## Images and files (`media_ingest.py`)

- **Images** get captioned via `LLMClient.describe_image()` (see below) —
  the caption becomes the chunk's text, with the image itself embedded as
  `![alt](../static/media/....png)` right after the caption. The extraction
  step then runs its normal topic/entity/concept prompt over that caption
  text, exactly like it would over a paragraph of notes.
- **PDFs, CSVs, JSON** get their text extracted directly (no LLM call needed
  for extraction itself — only the normal topic-extraction pass afterward).
  A PDF is only extracted if `pypdf` is installed; if it isn't (or fails to
  import for any reason — see the code comment in `_extract_pdf_text()`),
  the PDF is registered as an opaque attachment instead. `pypdf` is a plain
  dependency in `requirements.txt`, so this only matters if you're running
  outside the venv setup docs recommend.
- **DOCX, XLSX, PPTX, ZIP** are *not* parsed — no dependency was added for
  them. They become a one-line chunk ("Attached file: ... — content not
  parsed") plus a download link, so they still show up as an attachment on
  the compiled page, just without extracted content. Add a parser in
  `media_ingest.build_file_chunks()` if you need to go further.

### Where the files go

Every image/attachment gets copied into `wiki-app/static/media/`, deduped by
a content hash (so re-running the compiler on an unchanged file doesn't
create a second copy), and linked from the generated page with a path
**relative** to `wiki-app/docs/*.md` (`../static/media/<name>`). That
relative form is deliberate: Docusaurus's markdown image/link transform
resolves it at build time and rewrites it correctly for whatever `baseUrl`
is configured — a leading `/static/...` absolute path would NOT get the
`baseUrl` prefix and would silently break between local dev (`baseUrl: /`)
and the GitHub Pages build (`baseUrl: /<repo>/`).

## Email (`email_ingest.py`)

A dedicated module rather than folding emails into the generic text path,
because an email has real structure worth preserving — From/To/Cc/Date/
Subject, a body that may be `text/plain` or `text/html`, and attachments —
and because that structure is exactly what feeds the trust module below (an
email thread is a different *kind* of evidence than a scraped forum post).

- Parses `.eml` files with the Python standard library only (`email` +
  `email.policy`) — no new dependency for the common case of one message per
  file (Gmail's "Show original", Outlook's "Save as .eml", etc.).
- Prefers the `text/plain` body part; falls back to a small built-in
  HTML→text stripper if the message is HTML-only.
- Attachments are extracted, saved through the same `media_ingest` static
  copy/dedupe path, and linked under an **Attachments:** list in the chunk
  text.
- mbox archives (many messages in one file) are **out of scope** — split one
  into individual `.eml` files first if that's what you have.

## Trust and references (`trust.py`)

Two things, both deliberately deterministic (not left up to the LLM):

**1. Trust scoring** — every source gets a level from `unverified` → `low` →
`medium` → `high` → `verified`, resolved by `resolve_trust()`:

1. Check `data/source_trust.json` `rules` (glob pattern against the source's
   relative path, first match wins).
2. Fall back to `default_by_source_type` (also in that file, overridable).
3. Fall back to the built-in default: `text`/`email`/`file` → `medium`,
   `image` → `low` (an LLM's guess at what a picture shows is treated as
   less certain than parsed text by default).

`data/source_trust.json` ships with two example rules for this repo's sample
data (`samples/**` and `dummy-test/**` → `unverified`, since they're
fictional/generated) — edit it for your own domain, same pattern as
`data/link_overrides.json`.

**2. References** — `build_references()` dedupes a topic's chunk entries
down to one row per source, and `render_references_markdown()` renders a
`## References & Trust` markdown table. `synthesize_topic_wiki_pages()`
appends this **after** the LLM's response (stripping any `## Sources` /
`## References` section the model wrote itself first — `WIKI_PAGE_SYSTEM_PROMPT`
asks it not to, but this is a deterministic safety net either way). That
means the reference list is always accurate and always present, regardless
of what the model did with the "list your sources" instruction.

Example of what lands on a compiled page:

```markdown
## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/meshsync-debug.md` | text | Medium |
| 2 | `emails/mira-jonah-thread.eml` | email | Medium |
| 3 | `images/whiteboard.png` | image | Low |
```

## Vision captioning (`llm_client.py`)

`LLMClient.describe_image()` adds a second, vision-capable call path
alongside the existing `generate_response()`:

- Sends the image as a base64 `data:` URL in an `image_url` content block —
  works with the default `gpt-4o-mini` model (vision-capable) and anything
  else vision-capable reachable via `OPENAI_BASE_URL`.
- Cached separately from text prompts, keyed by the image's own content hash
  (not a text prompt) — so captioning is a cache hit even if the file gets
  renamed or moved, as long as the bytes are unchanged.
- No new environment variable: it reuses `OPENAI_API_KEY` / `OPENAI_MODEL` /
  `OPENAI_BASE_URL` from `.env`.

Note: `main.py`'s Step 1 (`step_read_data`) and Step 2 (extraction) both
build chunks independently — same as the pre-existing behavior for plain
text — so an image gets captioned up to twice on a cold compile. The second
call is a cache hit (SQLite-backed, file-based, so it's shared across both
calls in the same run), not a second real API call.

## Testing without an OpenAI key

Everything except the two LLM calls (topic extraction, image captioning) is
pure logic and unit-tested without any API key:
`tests/test_media_ingest.py`, `tests/test_email_ingest.py`,
`tests/test_trust.py`. `tests/test_multimedia_pipeline.py` exercises the
full chunk → extract → group → synthesize flow with a fake LLM, asserting
that mixed source types (text + image + email + file in one topic) all
appear correctly in the final References & Trust table.

## Next

- [05-compiler-pipeline.md](./05-compiler-pipeline.md) — the base 5-step pipeline
- [06-extraction-and-synthesis.md](./06-extraction-and-synthesis.md) — extraction/synthesis detail
- [10-data-layout-and-state.md](./10-data-layout-and-state.md) — `data/` file layout

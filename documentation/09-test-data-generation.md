# 09 — Test Data Generation

How fictional sample files are created under `data/raw/`. All generators write **only** to `data/raw/` (or subdirs). They do not run the compiler.

## Four generator scripts

| Script | Default output | Count | Style |
|--------|----------------|-------|-------|
| `scripts/dev/generate_junk_data.py` | `notes/`, `transcripts/`, `articles/`, `ideas/` | 10 fixed | Hand-written Karpathy-style junk |
| `scripts/dev/generate_bulk_dummy_data.py` | `samples/` + procedural subdirs | 20 + 85 | Curated `[SAMPLE]` + templates |
| `scripts/dev/generate_varied_dummy_data.py` | `varied-samples/{type}/` | 35 | Large multi-format (3–15 KB) |
| `scripts/dev/generate_extended_dummy_data.py` | `dummy-test/`, `samples/*` | 42 | Wave-2 curated ops docs |

All live in `compiler/scripts/dev/` — dev-only, not imported by the compiler pipeline.
Run each standalone, or through the `generate_dummy_data.py` dispatcher:

```bash
cd compiler
python scripts/dev/generate_junk_data.py [--overwrite] [--output ../data/raw]

# equivalent, via the dispatcher:
python scripts/dev/generate_dummy_data.py junk [--overwrite] [--output ../data/raw]
```

There's also `scripts/dev/keep_aurora_raw.py`, a one-off maintenance script that moves
non-Aurora-Labs raw files into `data/_archive_non_aurora/` — not a data generator, but
lives alongside them since it's dev-only tooling too.

## Filename and body markers

| Marker | Location | Meaning |
|--------|----------|---------|
| `[SAMPLE]` | Filename or body | Hand-authored narrative (safe to study) |
| `[DUMMY TEST DATA]` or `[DUMMY-TEST-DATA]` | Body or filename | Procedural / labeled test content |
| `[DUMMY-TEST-DATA]` | Procedural filename prefix | Bulk generator output |

**Safe to delete:** All generated test files. Regenerate with `--overwrite`.

## 1. scripts/dev/generate_junk_data.py

**Purpose:** Original seed set — messy Aurora Labs notes mimicking real knowledge-work chaos.

**Files (10):**

| Path | Content type |
|------|--------------|
| `notes/2026-06-01-standup-scribbles.txt` | Standup notes |
| `notes/2026-06-03-grocery-and-ideas.txt` | Grocery list + project ideas |
| `transcripts/2026-06-05-sync-fragment.txt` | Corrupted meeting transcript |
| `articles/scraped-forum-thread.txt` | Bad forum scrape |
| `articles/voice-memo-transcription.txt` | Low-confidence voice memo |
| `ideas/backlog-shower-thoughts.txt` | Unsorted backlog |
| `ideas/2026-06-07-product-naming-brainstorm.txt` | Naming brainstorm |
| `notes/2026-06-08-meeting-no-agenda.txt` | Unstructured meeting |
| `transcripts/support-email-thread.txt` | Support ticket dump |
| `notes/2026-06-10-fragmented-research.txt` | Research tab dump |

**Intentional mess:** Typos, incomplete sentences, contradictions (15 min vs hourly), Karpathy wiki references.

## 2. scripts/dev/generate_bulk_dummy_data.py

Unified CLI for curated samples and procedural bulk.

### Curated `[SAMPLE]` files (`BULK_FILES` dict)

20 hand-written files under `data/raw/samples/`:

- Aurora + TeaBuddy standups, retros, spec fragments
- Broken markdown export (tests MDX sanitizer)
- Competitor notes (SenseNode SN-400)
- User interview transcripts
- Cross-product idea dumps

### Procedural `[DUMMY TEST DATA]` (`generate_procedural_dummy_test_data`)

**Default count:** 85  
**Template:** `_dummy_body()` — rotates:

| Pool | Values |
|------|--------|
| `COMPANIES` | Aurora Labs, TeaBuddy, Nova Health, GreenGrid Energy |
| `PEOPLE` | Mira Chen, Jonah Park, Sam Rivera, Alex Kim, Jamie Lo, … |
| `PRODUCTS` | Nova Widget, MeshSync, TeaBuddy Puck, SenseNode SN-400, … |
| `DOC_KINDS` | meeting-notes, spec-draft, email-thread, research-dump, retro, support-ticket, partner-memo, forum-scrape |

**Filename pattern:**

```
{subdir}/[DUMMY-TEST-DATA]-{company-slug}-{kind-slug}-{seq:03d}-2026-07-{day:02d}.{ext}
```

Example: `bulk/[DUMMY-TEST-DATA]-greengrid-forum-scrape-395-2026-07-16.txt`

**Output subdirs:** `bulk/`, `dummy-test/`, `notes/`, `transcripts/`, `specs/`, `emails/`, `samples/bulk/`

### CLI flags

```bash
python scripts/dev/generate_bulk_dummy_data.py                    # samples + procedural
python scripts/dev/generate_bulk_dummy_data.py --samples-only
python scripts/dev/generate_bulk_dummy_data.py --dummy-only
python scripts/dev/generate_bulk_dummy_data.py --dummy-only --count 200 --start-seq 100
python scripts/dev/generate_bulk_dummy_data.py --dummy-only --only-subdir bulk --count 50
python scripts/dev/generate_bulk_dummy_data.py --varied-only      # delegates to varied generator
python scripts/dev/generate_bulk_dummy_data.py --overwrite
python scripts/dev/generate_bulk_dummy_data.py --output /path/to/data/raw
```

| Flag | Default | Description |
|------|---------|-------------|
| `--overwrite` | off | Replace existing files |
| `--output PATH` | `data/raw/` | Output root |
| `--count N` | 85 / 35 | Procedural or varied count |
| `--start-seq N` | 1 | First sequence number |
| `--samples-only` | off | Only `[SAMPLE]` under `samples/` |
| `--dummy-only` | off | Only procedural files |
| `--varied-only` | off | Large varied files only |
| `--only-subdir DIR` | all | Restrict procedural output |
| `--min-bytes` / `--max-bytes` | 3000 / 12000 | For `--varied-only` |

## 3. scripts/dev/generate_varied_dummy_data.py

**Purpose:** Stress-test chunking and linking with realistic document sizes.

**35 files default**, 3–15 KB each (cycled `SIZE_TARGETS`).

**Document types (`DOC_TYPES`):**

| Slug | Ext | Description |
|------|-----|-------------|
| `transcript` | `.txt` | Meeting fragments |
| `prd` | `.md` | Product requirements |
| `email` | `.txt` | Email threads |
| `research` | `.md` | Research dumps |
| `adr` | `.md` | Architecture decision records |
| `changelog` | `.md` | Firmware changelogs |
| `faq` | `.md` | Support FAQ |
| `chat-log` | `.txt` | Slack-style exports |
| `interview` | `.txt` | User interviews |
| `spec` | `.md` | Hardware/firmware specs |

**Output:** `data/raw/varied-samples/{type}/[DUMMY-TEST-DATA]-{type}-{company}-{seq}-....`

**Padding:** `FILLER_PARAGRAPHS` — domain sentences about MeshSync, TeaBuddy, battery contradictions, etc.

```bash
python scripts/dev/generate_varied_dummy_data.py
python scripts/dev/generate_varied_dummy_data.py --count 50 --overwrite
python scripts/dev/generate_varied_dummy_data.py --min-bytes 8000 --max-bytes 25000
python scripts/dev/generate_varied_dummy_data.py --clean --overwrite   # wipe varied-samples/ first
python scripts/dev/generate_varied_dummy_data.py --stats-only          # size stats only
```

## 4. scripts/dev/generate_extended_dummy_data.py

**Purpose:** Wave-2 hand-authored set (42 files).

**Categories:**

- `dummy-test/` — changelogs, QA matrices, release notes, slack dumps
- `samples/notes/`, `articles/`, `transcripts/`, `ideas/`, `support/`, `forums/`
- `samples/emails/`, `research/`, `specs/`, `legal/`, `social/`

```bash
python scripts/dev/generate_extended_dummy_data.py [--overwrite] [--output ../data/raw]
```

## Recommended full seed workflow

```bash
python compiler/scripts/dev/generate_junk_data.py
python compiler/scripts/dev/generate_bulk_dummy_data.py --overwrite
python compiler/scripts/dev/generate_extended_dummy_data.py --overwrite
python compiler/scripts/dev/generate_varied_dummy_data.py --overwrite
cd compiler && python main.py --force
```

## From test data to wiki (summary)

1. Generators write plain text → `data/raw/`
2. `python main.py` reads all `.txt`/`.md` recursively
3. Extraction pulls topics/entities from bold terms, headers, keywords
4. Many files mention same entities → shared topic pages (e.g. `meshsync.md`)
5. Linker connects mentions across pages
6. MOC lists all pages in `index.md`

See [05-compiler-pipeline.md](./05-compiler-pipeline.md) and [06-extraction-and-synthesis.md](./06-extraction-and-synthesis.md).

## Next

- [10-data-layout-and-state.md](./10-data-layout-and-state.md)
- [18-sample-domain.md](./18-sample-domain.md)

# 03 — Architecture

## System diagram

```mermaid
flowchart TB
    subgraph input [Human input]
        RAW["data/raw/<br/>text, .eml, images, PDF/CSV/JSON/DOCX/..."]
    end

    subgraph ingest [Non-text ingestors]
        EMAIL["email_ingest.py<br/>.eml → chunk"]
        MEDIA["media_ingest.py<br/>image/file → chunk"]
        VISION["LLMClient.describe_image()"]
        STATIC["wiki-app/static/media/"]
        MEDIA --> VISION
        MEDIA --> STATIC
        EMAIL --> STATIC
    end

    subgraph compiler [Python compiler — compiler/]
        S1["1. Data reading<br/>chunk raw files"]
        S2["2. Extraction<br/>topics, entities, concepts"]
        S3["3. Synthesis<br/>draft pages + References & Trust"]
        S4["4. Indexing<br/>index.json"]
        S5["5. Cross-linking<br/>inject links"]
        TRUST["trust.py<br/>resolve_trust / build_references"]
        TEMP["compiler/temp_output/"]
        STATE["data/state.json"]
        S1 --> S2 --> S3 --> S4 --> S5
        S3 --> TEMP
        S2 --> STATE
        S3 --> TRUST
    end

    subgraph output [Compiled pages — wiki-app/]
        DOCS["wiki-app/docs/<br/>linked markdown"]
        MOC["index.md Map of Content"]
    end

    subgraph backend [Express+TS backend — port 8000]
        NODE["backend/ (Express+TS)<br/>reads/writes data/, wiki-app/docs/"]
        SSE["SSE build stream<br/>spawns python3 main.py"]
        BRIDGE["spawns python3 cli.py<br/>for chat + email parsing"]
    end

    subgraph frontend [Express+TS+Tailwind frontend — port 3000]
        WIKIVIEW["/wiki/* — rendered markdown pages"]
        DASHVIEW["/dashboard, /chat, /emails,<br/>/resources, /graph, /analytics"]
    end

    RAW --> EMAIL
    RAW --> MEDIA
    RAW --> S1
    EMAIL --> S1
    MEDIA --> S1
    S5 --> DOCS
    S5 --> MOC
    NODE --> RAW
    NODE --> DOCS
    NODE --> STATE
    SSE --> S1
    NODE --> WIKIVIEW
    NODE --> DASHVIEW
```

Non-text sources (`.eml`, images, PDF/CSV/JSON/DOCX/XLSX/PPTX/ZIP) are turned
into ordinary text chunks by `email_ingest.py` / `media_ingest.py` *before*
Step 1 ever sees them, so everything from Step 1 onward is unchanged — see
[19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md).

## Layer table

| Layer | Path | Owner | Mutable by agents? |
|-------|------|-------|-------------------|
| Raw sources | `data/raw/` | Human | Read-only unless ingesting |
| Compiler state | `data/state.json` | Compiler | No (auto-written) |
| Link overrides | `data/link_overrides.json` | Human / API | Yes (manual rules) |
| Source trust rules | `data/source_trust.json` | Human | Yes (manual rules) |
| LLM cache | `data/.llm-cache.sqlite` | Compiler | No |
| Draft output | `compiler/temp_output/` | Compiler | No |
| Wiki markdown | `wiki-app/docs/` | Compiler (+ optional human refine) | Regenerated |
| Ingested media/attachments | `wiki-app/static/media/` | Compiler | No (auto-written, content-hash deduped) |
| Compiled pages | `wiki-app/` (`docs/`, `static/media/`) | Backend + frontend (`backend/`, `frontend/`) | Config and UI code |
| Agent schema | `AGENTS.md` | Human + LLM | Co-evolved |

## Data flow (simplified)

```
1. Human drops file → data/raw/notes/my-meeting.md
2. Compiler reads → splits into chunks (~2000 chars)
3. Extraction → topics ["MeshSync", "Battery"], entities, concepts
4. State saved → data/state.json (MD5 + extractions)
5. Synthesis → compiler/temp_output/meshsync.md (draft)
6. Index → compiler/temp_output/index.json {"MeshSync": "meshsync.md", ...}
7. Linking → wiki-app/docs/meshsync.md (with [links](./other.md))
8. MOC → wiki-app/docs/index.md (hierarchical TOC)
9. frontend/ → serves at /wiki/meshsync
```

## Two output directories

Understanding the split between `temp_output/` and `wiki-app/docs/` is essential:

| Directory | Content | Linked? | Front matter |
|-----------|---------|---------|--------------|
| `compiler/temp_output/` | Draft topic pages | No (plain or partial FM) | May have basic YAML from synthesis |
| `wiki-app/docs/` | Exported final pages | Yes | Full front matter (id, title, slug, tags, page_type) |

The linker reads drafts from `temp_output/`, injects links, wraps/sanitizes for MDX, and writes to `wiki-app/docs/`.

Every generated file carries an `<!-- AUTO-GENERATED ... -->` HTML comment right after
its frontmatter — a draft-specific note in `temp_output/`, a different final note in
`wiki-app/docs/` — so an editor opening either file sees immediately that it's
compiler output and where edits actually belong. The linker strips the draft's note
before linking and writes its own; see `insert_generated_banner()` /
`strip_generated_banner()` in `yaml_frontmatter.py`.

## Incremental vs full rebuild

| Flag | Step 2 | Step 3 | Step 5 |
|------|--------|--------|--------|
| (default) | Skip unchanged MD5 | Regenerate dirty topics only | Re-link affected pages only |
| `--force` | Re-extract all | Regenerate all topics | Re-link all |

Incremental behavior is critical when `data/raw/` has 1000+ test files.

## LLM-only pipeline

The compiler is **LLM-only** — extraction, synthesis, and linking all call `LLMClient`
directly and raise via `require_llm()` if `OPENAI_API_KEY` is unset. There is no
heuristic/offline code path:

```
                    ┌─────────────────┐
                    │   main.py       │
                    └────────┬────────┘
                             │
                      require_llm()
                             │
                 ┌───────────┴───────────┐
                 ▼                       ▼
          key present              key missing
                 │                       │
       OpenAI + SQLite cache     RuntimeError, exit 1
```

## Backend + frontend (Node)

The backend does **not** participate in the compile path when you run
`python main.py` directly — it's a separate always-on service. It:

- Reads `data/raw/`, `wiki-app/docs/`, `data/state.json`
- Spawns `python3 main.py` as a subprocess for `/api/build/stream`
- Spawns `python3 cli.py` for chat (`rag_engine.py`) and email parsing (`email_engine.py`)
- Aggregates analytics and knowledge-graph data for dashboards

Every page (wiki content and dashboards alike) is server-rendered by the
frontend (Express+EJS), with hand-written TypeScript client bundles for
interactivity — no React, no client framework. See
[11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md).

## Tech stack summary

| Component | Technology |
|-----------|------------|
| Compiler orchestration | Python 3.12+, `rich` |
| LLM | OpenAI SDK, SQLite cache |
| Backend API | Express + TypeScript (`backend/`) |
| Frontend | Express + TypeScript + EJS (`frontend/`), no client framework |
| Styling | Tailwind CSS 3 + `@tailwindcss/typography` |
| Client bundling | esbuild (hand-written TypeScript, per page) |
| Live builds | Server-Sent Events (SSE) |
| CI | GitHub Actions → GitHub Pages |

## Design principles

1. **Raw files are truth** — the wiki is a derived, lossy-but-useful view.
2. **Linking is a separate pass** — synthesis writes content; linker connects it.
3. **Idempotent-ish compiles** — MD5 state enables fast iteration.
4. **LLM-only, cached** — no offline fallback; the SQLite response cache keeps repeat compiles cheap.
5. **Sample domain is disposable** — clear `data/raw/`, add yours, `--force`.

## Next

- [04-repository-structure.md](./04-repository-structure.md) — file tree
- [05-compiler-pipeline.md](./05-compiler-pipeline.md) — step details

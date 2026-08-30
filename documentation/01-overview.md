# 01 — Overview

## What LLM Wiki is

**LLM Wiki** is a personal knowledge base that turns unstructured text into a linked, browsable wiki. You add raw notes (`.txt`, `.md`) to `data/raw/`. A Python **compiler** reads them, extracts topics and entities, writes markdown pages, injects cross-links, and exports Docusaurus-ready files to `wiki-app/docs/`. A **Docusaurus 3** site renders those pages in the browser.

The project implements the [Karpathy LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f):

- **Humans** own messy source material (`data/raw/`).
- **Machines** own synthesis (compiler + optional LLM API).
- **Agents** (Cursor) can refine generated pages and workflows but should not silently edit raw sources.

## What problem it solves

| Without LLM Wiki | With LLM Wiki |
|------------------|---------------|
| Notes scattered across folders, emails, transcripts | Single searchable wiki with cross-links |
| No shared index of people, products, concepts | Topic pages grouped by extraction |
| Manual linking is tedious | Linker auto-injects links from a topic index |
| Re-ingesting changed files is manual | Incremental compiles via MD5 state |

## Core components

```
data/raw/          Human input — never auto-edited by agents without intent
     ↓
compiler/          Python pipeline (main.py)
     ↓
wiki-app/docs/     Generated markdown (Docusaurus docs)
     ↓
wiki-app/          Static site + dashboard pages (React)
```

Optional:

```
compiler/server.py   FastAPI on port 8000 — dashboards, live compile SSE
```

## Sample domain

The repo ships with fictional IoT companies used as pipeline stress tests:

| Company | Focus |
|---------|-------|
| **Aurora Labs** | Open mesh sensors (Nova Widget, MeshSync) |
| **TeaBuddy** | BLE smart tea puck |
| **Nova Health** | Clinical wearables (PulsePatch) |
| **GreenGrid Energy** | Home energy mesh (GreenGrid Hub) |

Replace `data/raw/` with your own topic when ready. The sample data is disposable.

## Operating mode

The compiler is **LLM-only** — every step that interprets or writes content (extraction,
synthesis, linking) requires a valid `OPENAI_API_KEY` in `.env`. There is no heuristic /
offline fallback. Responses are cached in a SQLite file at `data/.llm-cache.sqlite`, so
re-running the compiler on unchanged input costs no extra API calls. See
[08-llm-and-heuristics.md](./08-llm-and-heuristics.md).

## Key URLs (local dev)

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Docusaurus dev server |
| http://localhost:3000/docs/index | Map of Content (wiki home) |
| http://localhost:3000/workspace | Compiler dashboard |
| http://localhost:3000/graph | Topic graph visualization |
| http://localhost:3000/analytics | Metrics, tags, dead links |
| http://localhost:8000/api/health | API health check |

Static wiki docs work without the API. Dashboard pages require `compiler/run_server.sh`.

## Ownership rules (important)

| Path | Owner | Rule |
|------|-------|------|
| `data/raw/` | Human | Source of truth; agents read, rarely write |
| `wiki-app/docs/` | Compiler | Regenerated on compile; manual edits may be overwritten |
| `data/state.json` | Compiler | Incremental state; gitignored |
| `data/link_overrides.json` | Human / API | Manual link rules; persisted across compiles |
| `compiler/temp_output/` | Compiler | Draft pages + `index.json`; intermediate only |

## Next steps

- [02-getting-started.md](./02-getting-started.md) — install and run
- [03-architecture.md](./03-architecture.md) — how layers connect
- [05-compiler-pipeline.md](./05-compiler-pipeline.md) — what `main.py` does step by step

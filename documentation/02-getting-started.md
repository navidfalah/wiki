# 02 — Getting Started

## Prerequisites

| Tool | Version | Used for |
|------|---------|----------|
| **Python** | 3.12+ recommended | Compiler pipeline, retrieval/chat (rag_engine.py), email parsing (email_engine.py) |
| **Node.js** | ≥ 18 | Express+TypeScript backend and frontend |
| **npm** | Bundled with Node | `backend/` and `frontend/` dependencies |
| **Git** | Any recent | Clone, CI deploy |

Optional:

- **OpenAI API key** (or compatible endpoint) for LLM extraction/synthesis
- **GitHub Pages** enabled on the repo for automated deploy from `main`

## Clone and configure

```bash
git clone <your-repo-url> wiki
cd wiki
cp .env.example .env
```

Edit `.env` and set your API key — the compiler is **LLM-only** and will not run without one:

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

Without a key, `python main.py` exits immediately with an error. See
[08-llm-and-heuristics.md](./08-llm-and-heuristics.md).

## Python setup (compiler)

```bash
cd compiler
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Dependencies (`requirements.txt`):

- `openai` — LLM client
- `python-dotenv` — loads `.env` from repo root
- `pyyaml` — MOC generator
- `rich` — terminal progress UI in `main.py`

The Python side no longer runs its own API server (`server.py`/FastAPI is
retired) — the Express+TS backend calls into `compiler/main.py` and
`compiler/cli.py` as subprocesses instead. See
[11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md).

## First compile

```bash
cd compiler
source .venv/bin/activate
python main.py --force
```

`--force` reprocesses every file in `data/raw/` regardless of `data/state.json`. Use it on first run or after bulk data changes.

Expected output: Rich terminal panels for Steps 1–5, then Map of Content generation. Final pages land in `wiki-app/docs/` (still the compiler's output directory — see the note in
[11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md) on why that path didn't change even though Docusaurus is gone).

If you see `No raw files found under data/raw/`:

```bash
python scripts/dev/generate_junk_data.py    # from compiler/ — creates 10 seed files
python main.py --force
```

## Node setup (backend + frontend)

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Three-terminal development setup

### Terminal 1 — compile when raw data changes

```bash
cd compiler && source .venv/bin/activate
python main.py              # incremental (only changed files)
python main.py --force      # full rebuild
```

### Terminal 2 — backend (Express + TypeScript API)

```bash
cd backend
npm run dev:server
```

- Runs `src/index.ts` directly via `tsx watch` (auto-restarts on change)
- Port **8000**
- Also spawns `python3` for build/chat/email requests — `PYTHON_BIN` env var overrides the interpreter if `python3` isn't on `PATH`

Verify: `curl http://localhost:8000/api/health` → `{"status":"ok"}`

### Terminal 3 — frontend (Express + TypeScript + Tailwind)

```bash
cd frontend
npm run dev:server     # Express server, tsx watch
```

In two more terminals (or run once before starting, then re-run after
editing Tailwind classes / client TS):

```bash
cd frontend && npm run dev:css      # Tailwind watch → dist-static/css/app.css
cd frontend && npm run dev:client   # esbuild watch → dist-static/js/*.js
```

Default port **3000**. Kill conflicting processes if port is in use.

## One-command production build

From repo root:

```bash
chmod +x build_wiki.sh
./build_wiki.sh                  # compile + build backend + build frontend
./build_wiki.sh --force          # pass --force to the compiler
```

`build_wiki.sh`:

1. Creates/activates `compiler/.venv`, installs Python deps
2. Runs `python compiler/main.py` (forwards CLI args)
3. `npm install` + `npm run build` in `backend/` → `backend/dist/`
4. `npm install` + `npm run build` in `frontend/` → `frontend/dist/` + `frontend/dist-static/`

Run the production build:

```bash
cd backend && npm start    # terminal 1 — port 8000
cd frontend && npm start   # terminal 2 — port 3000
```

Or with Docker Compose (also builds both images):

```bash
docker compose up --build
```

## CLI quick reference

```bash
# Compiler (from compiler/) — requires OPENAI_API_KEY
python main.py                   # incremental
python main.py --force           # reprocess all raw files

# Test data generators (from compiler/)
python scripts/dev/generate_junk_data.py [--overwrite]
python scripts/dev/generate_bulk_dummy_data.py [--overwrite] [--samples-only | --dummy-only | --varied-only]
python scripts/dev/generate_varied_dummy_data.py [--overwrite] [--count N]
python scripts/dev/generate_extended_dummy_data.py [--overwrite]

# Maintenance
python fix_frontmatter.py [--dry-run] [--docs-dir PATH]
python fix_dead_links.py [--dry-run] [--docs-dir PATH]
python reviewer.py               # LLM quality review (needs API key)

# Backend (from backend/)
npm run dev:server               # tsx watch, port 8000
npm run build                    # tsc -> dist/
npm start                        # node dist/index.js

# Frontend (from frontend/)
npm run dev:server               # tsx watch, port 3000
npm run dev:css                  # tailwind watch
npm run dev:client               # esbuild watch (client bundles)
npm run build                    # css + client + server -> dist/, dist-static/
npm start                        # node dist/index.js
```

## What to do after first run

1. Open http://localhost:3000/wiki — browse the wiki pages
2. Open http://localhost:3000/dashboard — run the compiler, manage source folders, browse raw files
3. Add a `.md` file under `data/raw/notes/` and run `python main.py`
4. Read [05-compiler-pipeline.md](./05-compiler-pipeline.md) for pipeline details

## Next

- [03-architecture.md](./03-architecture.md)
- [09-test-data-generation.md](./09-test-data-generation.md) — how sample data is created

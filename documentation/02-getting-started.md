# 02 — Getting Started

## Prerequisites

| Tool | Version | Used for |
|------|---------|----------|
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

Without a key, `node compiler/main.js` exits immediately with an error. See
[08-llm-and-heuristics.md](./08-llm-and-heuristics.md).

## Build the JavaScript compiler

```bash
npm install --prefix backend
npm run build --prefix backend
```

The compiler and API run on Node.js. The legacy Python entry points have been
retired.

## First compile

```bash
node compiler/main.js --force
```

`--force` reprocesses every file in `data/raw/` regardless of `data/state.json`. Use it on first run or after bulk data changes.

Expected output: progress for the compile stages and Map of Content generation. Final pages land in `wiki-app/docs/` (still the compiler's output directory — see the note in
[11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md) on why that path didn't change even though Docusaurus is gone).

If you see `No raw files found under data/raw/`:

```bash
python scripts/dev/generate_junk_data.py    # from compiler/ — creates 10 seed files
node compiler/main.js --force
```

## Node setup (backend + frontend)

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Three-terminal development setup

### Terminal 1 — compile when raw data changes

```bash
node compiler/main.js              # incremental (only changed files)
node compiler/main.js --force      # full rebuild
```

### Terminal 2 — backend (Express + TypeScript API)

```bash
cd backend
npm run dev:server
```

- Runs `src/index.ts` directly via `tsx watch` (auto-restarts on change)
- Port **8000**
- Runs API routes and compiler services on Node.js

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
node build_wiki.js               # compile + build backend + build frontend
node build_wiki.js --force       # pass --force to the compiler
```

`build_wiki.js`:

1. Installs missing dependencies and builds `backend/` → `backend/dist/`
2. Runs `node compiler/main.js` (forwards CLI args)
3. Installs missing dependencies and builds `frontend/` → `frontend/dist/` + `frontend/dist-static/`

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
# JavaScript compiler — build once after checkout; model calls depend on configuration
npm run build --prefix backend
node compiler/main.js            # incremental
node compiler/main.js --force    # reprocess all raw files

# Test data generators (from compiler/)
python scripts/dev/generate_junk_data.py [--overwrite]
python scripts/dev/generate_bulk_dummy_data.py [--overwrite] [--samples-only | --dummy-only | --varied-only]
python scripts/dev/generate_varied_dummy_data.py [--overwrite] [--count N]
python scripts/dev/generate_extended_dummy_data.py [--overwrite]

# Maintenance (JavaScript)
node compiler/fix_frontmatter.js [--dry-run] [--docs-dir PATH]
node compiler/fix_dead_links.js [--dry-run] [--docs-dir PATH]
node compiler/fix_mdx_body.js [--dry-run] [--docs-dir PATH]
node compiler/dead_link_checker.js [--docs-dir PATH]
node compiler/moc_generator.js [--docs-dir PATH] [--output PATH]
node compiler/faithfulness_heuristic.js [--docs PATH] [--raw PATH]

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
2. Open http://localhost:3000/dashboard — search or ask the wiki, see what needs attention, run the compiler and manage source folders (raw files live under Resources → Files)
3. Add a `.md` file under `data/raw/notes/` and run `node compiler/main.js`
4. Read [05-compiler-pipeline.md](./05-compiler-pipeline.md) for pipeline details

## Next

- [03-architecture.md](./03-architecture.md)
- [09-test-data-generation.md](./09-test-data-generation.md) — how sample data is created

# 02 — Getting Started

## Prerequisites

| Tool | Version | Used for |
|------|---------|----------|
| **Python** | 3.12+ recommended | Compiler, API server |
| **Node.js** | ≥ 18 | Docusaurus dev server and build |
| **npm** | Bundled with Node | `wiki-app` dependencies |
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
- `fastapi`, `uvicorn` — API server

## First compile

```bash
cd compiler
source .venv/bin/activate
python main.py --force
```

`--force` reprocesses every file in `data/raw/` regardless of `data/state.json`. Use it on first run or after bulk data changes.

Expected output: Rich terminal panels for Steps 1–5, then Map of Content generation. Final pages land in `wiki-app/docs/`.

If you see `No raw files found under data/raw/`:

```bash
python scripts/dev/generate_junk_data.py    # from compiler/ — creates 10 seed files
python main.py --force
```

## Node setup (wiki app)

```bash
cd wiki-app
npm install
npm start
```

Site: **http://localhost:3000**  
Wiki index: **http://localhost:3000/docs/index**

## Three-terminal development setup

### Terminal 1 — compile when raw data changes

```bash
cd compiler && source .venv/bin/activate
python main.py              # incremental (only changed files)
python main.py --force      # full rebuild
```

### Terminal 2 — API server (for dashboards)

```bash
cd compiler
chmod +x run_server.sh
./run_server.sh
```

- Creates `.venv` if missing
- Installs pip deps quietly
- Runs `server.py` on **port 8000** with hot reload
- API base: http://localhost:8000

Verify: `curl http://localhost:8000/api/health` → `{"status":"ok"}`

### Terminal 3 — Docusaurus dev server

```bash
cd wiki-app && npm start
```

Default port **3000**. Kill conflicting processes if port is in use.

## One-command production build

From repo root:

```bash
chmod +x build_wiki.sh
./build_wiki.sh                  # compile + Docusaurus build
./build_wiki.sh --force          # pass --force to compiler
```

`build_wiki.sh`:

1. Creates/activates `compiler/.venv`
2. `pip install -r requirements.txt`
3. Runs `python compiler/main.py` (forwards CLI args)
4. `npm install` in `wiki-app/` if needed
5. `npm run build` → output in `wiki-app/build/`

Preview production build:

```bash
cd wiki-app && npm run serve
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
python reviewer.py               # LLM quality review (needs API key)

# Wiki app (from wiki-app/)
npm start                        # dev server :3000
npm run build                    # production static site
npm run serve                    # preview build/
npm run clear                    # clear Docusaurus cache
```

## What to do after first run

1. Open http://localhost:3000/docs/index — browse the Map of Content
2. Open http://localhost:3000/workspace — compare raw vs compiled (needs API)
3. Add a `.md` file under `data/raw/notes/` and run `python main.py`
4. Read [05-compiler-pipeline.md](./05-compiler-pipeline.md) for pipeline details

## Next

- [03-architecture.md](./03-architecture.md)
- [09-test-data-generation.md](./09-test-data-generation.md) — how sample data is created

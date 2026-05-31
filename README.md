# LLM Wiki Project

Personal knowledge base using the **[Karpathy LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)** — raw junk data in, compiled markdown out, static site for browsing.

## Structure

```
llm-wiki-project/
├── build_wiki.sh            # One-command: compile + Docusaurus build
├── data/raw/                # Junk / source files (you add here)
├── compiler/                # Python pipeline
│   └── main.py              # Full orchestrator (5 steps, rich logs)
└── wiki-app/                # Docusaurus static site
    └── docs/                # Generated output (do not edit by hand)
```

## One-command build

```bash
chmod +x build_wiki.sh
./build_wiki.sh
```

Heuristic mode (no API key):

```bash
./build_wiki.sh --heuristic-only
```

## Pipeline (compiler/main.py)

| Step | Name | Action |
|------|------|--------|
| 1 | Data Reading | Scan `data/raw/`, split into chunks |
| 2 | Extraction | Extract topics, entities, concepts |
| 3 | Synthesis | Write draft pages → `compiler/temp_output/` |
| 4 | Indexing | Build `temp_output/index.json` |
| 5 | Cross-linking | Inject links → `wiki-app/docs/` |

## Manual setup

### Python compiler

```bash
cd compiler
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Initialize Docusaurus (first time only)

If `wiki-app/` does not exist yet, run from the **repo root**:

```bash
npm create docusaurus@latest wiki-app classic -- --javascript
```

When prompted, choose:
- **Type:** classic
- **Language:** JavaScript
- **Package name:** llm-wiki-app

Then replace the generated config with this project's files, or merge these settings into `wiki-app/docusaurus.config.js`:

- `docs.path` → `'docs'` (compiler output directory)
- `docs.routeBasePath` → `'docs'`
- `docs.sidebarPath` → `'./sidebars.js'`
- `blog` → disabled

Install dependencies and preview:

```bash
cd wiki-app
npm install
npm start        # dev server → http://localhost:3000
npm run build    # static output → wiki-app/build/
```

### Environment

Copy `.env.example` → `.env`:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Without a key, the compiler uses **heuristic mode** (no API calls).

## Sample data

Fictional **Aurora Labs** junk data is pre-loaded under `data/raw/`. Generate more with:

```bash
python compiler/generate_junk_data.py
```

See `AGENTS.md` and `PROMPTS.md` for Cursor workflows.

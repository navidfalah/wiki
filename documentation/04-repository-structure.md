# 04 — Repository Structure

Complete map of the repository. Paths are relative to repo root (`wiki/`).

## Top level

```
wiki/
├── README.md                 # Long-form project README
├── PROJECT_GUIDE.md          # Pointer to documentation/
├── AGENTS.md                 # Agent/human workflow schema
├── PROMPTS.md                # Example Cursor prompts
├── build_wiki.sh             # One-command: compile + Docusaurus build
├── .env.example              # API key template → copy to .env
├── .gitignore
├── documentation/            # This documentation set
├── data/                     # All compiler input and runtime state
├── compiler/                 # Python pipeline + API + generators
└── wiki-app/                 # Docusaurus site + dashboards
```

## `data/`

```
data/
├── raw/                      # ALL compiler input (.txt, .md, recursive)
│   ├── notes/
│   ├── transcripts/
│   ├── articles/
│   ├── ideas/
│   ├── emails/
│   ├── specs/
│   ├── research/
│   ├── dummy-test/
│   ├── bulk/
│   ├── samples/              # [SAMPLE] curated narratives
│   │   ├── notes/, articles/, transcripts/, ...
│   │   └── bulk/
│   └── varied-samples/       # Large multi-type test files
│       ├── transcript/, prd/, email/, adr/, ...
│
├── state.json                # Incremental compiler state (gitignored, created on compile)
├── link_overrides.json       # Manual knowledge-graph connection rules
└── .llm-cache.sqlite         # LLM response cache (gitignored, optional)
```

**Note:** Only `.txt` and `.md` under `data/raw/` are read. Other extensions are ignored.

## `compiler/`

```
compiler/
├── main.py                   # Full 5-step pipeline entry point
├── synthesizer.py            # Chunking, extraction, synthesis
├── linker.py                 # Topic index, cross-link injection, export
├── moc_generator.py          # Hierarchical index.md
├── llm_client.py             # OpenAI client, cache, retries
├── link_overrides.py         # require/block connection rules
├── server.py                 # FastAPI API (:8000)
├── build_runner.py           # SSE subprocess wrapper for main.py
├── analytics.py              # Metrics, tags, dead-link audit
├── reviewer.py               # LLM quality review → review_report.txt
├── dead_link_checker.py      # Broken link detection
├── models.py                 # Path constants (RAW_DIR, OUTPUT_DIR, STATE_FILE)
├── yaml_frontmatter.py       # Safe YAML quoting
├── mdx_sanitize.py           # Sanitize body for Docusaurus MDX
├── fix_frontmatter.py        # Repair quoted YAML fields in docs
├── fix_mdx_body.py           # MDX body fixes
├── run_server.sh             # Start API with venv
├── requirements.txt
├── review_report.txt         # Output of reviewer.py (if run)
├── temp_output/              # Draft pages + index.json (intermediate)
│   ├── *.md
│   └── index.json
├── generate_junk_data.py       # 10 seed Aurora junk files
├── generate_bulk_dummy_data.py # [SAMPLE] + procedural bulk
├── generate_varied_dummy_data.py
├── generate_extended_dummy_data.py
└── .venv/                    # Python virtualenv (local, gitignored)
```

### Path constants (`models.py`)

| Constant | Resolves to |
|----------|-------------|
| `PROJECT_ROOT` | Parent of `compiler/` (repo root) |
| `RAW_DIR` | `data/raw/` |
| `OUTPUT_DIR` | `wiki-app/docs/` |
| `STATE_FILE` | `data/state.json` |

## `wiki-app/`

```
wiki-app/
├── docusaurus.config.js      # Site config, navbar, wikiApiUrl
├── sidebars.js               # Docs sidebar (wikiSidebar)
├── tailwind.config.js        # Dashboard Tailwind (preflight: false)
├── package.json
├── docs/                     # Compiler output — generated markdown
│   ├── index.md              # Map of Content (auto-generated)
│   ├── *.md                  # Topic pages (flat at docs root)
│   └── *.md                  # Flat topic pages (current pipeline)
├── src/
│   ├── pages/                # Custom React routes
│   │   ├── workspace.js      # /workspace — Dashboard
│   │   ├── analytics.js      # /analytics
│   │   └── graph.js          # /graph
│   ├── components/
│   │   ├── DataWorkspace/    # Raw file browser, doc preview
│   │   ├── LiveBuild/        # SSE compile log viewer
│   │   ├── WikiGraph/        # Topic force graph
│   │   ├── AnalyticsAudit/   # Metrics, tags, dead links
│   │   ├── Backlinks/        # Backlinks plugin UI
│   │   ├── PageShell/        # Layout wrapper
│   │   ├── PageHeader/       # Page titles, breadcrumbs
│   │   └── ui/               # Button, DashboardNav
│   ├── utils/wikiApi.js      # API client helpers
│   └── css/custom.css
├── plugins/
│   └── backlinksPlugin.js    # Backlinks for doc pages
└── build/                    # Production output (after npm run build)
```

## `.github/workflows/`

```
.github/workflows/wiki-build.yml   # CI: compile → build → GitHub Pages
```

## Files you should not commit

Typically gitignored:

- `.env`
- `compiler/.venv/`
- `data/state.json`
- `data/.llm-cache.sqlite`
- `wiki-app/node_modules/`
- `wiki-app/build/`

## Next

- [05-compiler-pipeline.md](./05-compiler-pipeline.md)
- [17-compiler-module-reference.md](./17-compiler-module-reference.md)

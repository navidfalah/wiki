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
├── raw/                      # ALL compiler input, recursive
│   ├── notes/                 # .txt / .md
│   ├── transcripts/
│   ├── articles/
│   ├── ideas/
│   ├── emails/                 # .eml — see email_ingest.py
│   ├── specs/
│   ├── research/
│   ├── dummy-test/
│   ├── bulk/
│   ├── samples/               # [SAMPLE] curated narratives
│   │   ├── notes/, articles/, transcripts/, ...
│   │   └── bulk/
│   └── varied-samples/        # Large multi-type test files
│       ├── transcript/, prd/, email/, adr/, ...
│
├── state.json                # Incremental compiler state (gitignored, created on compile)
├── link_overrides.json       # Manual knowledge-graph connection rules
├── source_trust.json         # Per-source trust level rules — see trust.py
└── .llm-cache.sqlite         # LLM response cache (gitignored, optional)
```

**Recognized extensions under `data/raw/`:** `.txt` `.md` (text), `.eml`
(email), `.png` `.jpg` `.jpeg` `.gif` `.webp` `.bmp` (image), `.pdf` `.csv`
`.json` `.docx` `.xlsx` `.pptx` `.zip` (file attachment). See
[19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md).
Everything else (and dotfiles like `.gitkeep`) is ignored.

## `compiler/`

```
compiler/
├── main.py                   # Full 5-step pipeline entry point
├── synthesizer.py            # Chunking, extraction, synthesis
├── text_chunking.py          # Shared paragraph-chunking (text/email/file)
├── media_ingest.py           # Images + file attachments → chunks
├── email_ingest.py           # .eml parsing → chunks
├── trust.py                  # Source trust levels + References & Trust section
├── linker.py                 # Topic index, cross-link injection, export
├── moc_generator.py          # Hierarchical index.md
├── llm_client.py             # OpenAI client, cache, retries, vision captioning
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
├── requirements-dev.txt      # + ruff, pytest
├── pyproject.toml            # ruff + pytest config
├── review_report.txt         # Output of reviewer.py (if run, not committed)
├── temp_output/              # Draft pages + index.json (intermediate)
│   ├── *.md
│   └── index.json
├── tests/                    # pytest suite for pure-logic modules
│   ├── test_yaml_frontmatter.py
│   ├── test_mdx_sanitize.py
│   ├── test_synthesizer.py
│   ├── test_linker.py
│   ├── test_link_overrides.py
│   ├── test_media_ingest.py
│   ├── test_email_ingest.py
│   ├── test_trust.py
│   ├── test_multimedia_pipeline.py     # mixed source types, end-to-end w/ fake LLM
│   └── test_generated_banner_pipeline.py
├── scripts/dev/               # Dev-only test-data generators (not part of the pipeline)
│   ├── generate_dummy_data.py         # Dispatcher CLI for the generators below
│   ├── generate_junk_data.py          # 10 seed Aurora junk files
│   ├── generate_bulk_dummy_data.py    # [SAMPLE] + procedural bulk
│   ├── generate_varied_dummy_data.py
│   ├── generate_extended_dummy_data.py
│   └── keep_aurora_raw.py             # Archive non-Aurora raw files
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
├── static/
│   └── media/                # Ingested images/attachments (content-hash deduped,
│                              # gitignored except .gitkeep — see media_ingest.py)
└── build/                    # Production output (after npm run build)
```

## `.github/workflows/`

```
.github/workflows/wiki-build.yml   # CI: compile → build → GitHub Pages
.github/workflows/pr-checks.yml    # CI: lint + pytest + build on pull_request
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

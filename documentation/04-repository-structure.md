# 04 — Repository Structure

For the current Express frontend/backend and feature module layout, see the **[project map](project-map.md)**. The detailed tree below includes the older viewer and historical paths.

Complete map of the repository. Paths are relative to repo root (`wiki/`).

## Top level

```
wiki/
├── PROJECT_GUIDE.md          # Project and documentation map
├── PROJECT_GUIDE.md          # Pointer to documentation/
├── AGENTS.md                 # Agent/human workflow schema
├── PROMPTS.md                # Example Cursor prompts
├── build_wiki.js             # One-command: compile + backend/frontend builds
├── .env.example              # API key template → copy to .env
├── .gitignore
├── documentation/            # This documentation set
├── data/                     # All compiler input and runtime state
├── compiler/                 # JavaScript compiler tools and evaluations
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
├── source_trust.json         # Per-source trust level rules — see backend/src/lib/trust.js
└── .llm-cache.sqlite         # LLM response cache (gitignored, optional)
```

**Recognized extensions under `data/raw/`:** `.txt` `.md` (text), `.eml`
(email), `.png` `.jpg` `.jpeg` `.gif` `.webp` `.bmp` (image), `.mp3` `.wav`
`.m4a` `.ogg` `.flac` `.aac` (audio), `.pdf` `.csv` `.tsv` `.json` `.xml`
`.html` `.htm` `.yaml` `.yml` `.log` `.docx` `.xlsx` `.pptx` `.zip` (file
attachment, text extracted — PDF/DOCX/XLSX/PPTX via a parsing library, ZIP
as a file listing, the rest via stdlib), `.rtf` `.odt` `.ods` `.odp` `.rar`
`.7z` `.tar` `.gz` `.tgz` `.epub` `.mp4` `.mov` `.avi` `.mkv` `.m4v` (file
attachment, opaque — metadata + download link only). See
[19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md).
Everything else (and dotfiles like `.gitkeep`) is ignored.

## `compiler/`

```
compiler/
├── main.js                   # JavaScript compiler command-line entry point
├── models.js                 # Shared paths for raw, output and state data
├── doc_utils.js              # Markdown, frontmatter and topic helpers
├── trust.js                  # Source trust levels
├── raw_folders.js            # Raw-folder management helpers
├── evalGate.js               # Offline compiler evaluation
├── reviewer.js               # LLM review → review_report.txt
├── fix_frontmatter.js        # Repair quoted YAML fields in docs
├── fix_mdx_body.js           # MDX body fixes
└── temp_output/              # Draft pages + topic index (intermediate)
```

The running compiler implementation is `backend/src/lib/compilerEngine.js`;
`compiler/main.js` is its command-line entry point. The app's current
automated suites use Vitest under `backend/src/` and `frontend/`.

### Path constants (`models.js`)

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
.github/workflows/pr-checks.yml    # CI: Node lint + typecheck + tests + build
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

# 11 — Wiki App and Dashboards

**Path:** `wiki-app/`  
**Framework:** Docusaurus 3 + React 18 + Tailwind CSS 3

## Two parts of the site

| Part | Route prefix | Source | Needs API? |
|------|--------------|--------|------------|
| **Wiki docs** | `/docs/...` | `wiki-app/docs/` (compiler output) | No |
| **Dashboards** | `/workspace`, `/graph`, `/analytics` | `src/pages/*.js` (React) | Yes (port 8000) |

## Docusaurus configuration

**File:** `docusaurus.config.js`

| Setting | Value |
|---------|-------|
| `title` | Aurora Labs Wiki |
| `docs.path` | `docs` |
| `docs.routeBasePath` | `docs` |
| `docs.sidebarPath` | `./sidebars.js` |
| `blog` | disabled |
| `onBrokenLinks` | `warn` |
| `customFields.wikiApiUrl` | `process.env.WIKI_API_URL \|\| 'http://localhost:8000'` |

### GitHub Pages base URL

```javascript
baseUrl: isGitHubPagesBuild ? `/${projectName}/` : '/'
```

Local dev: `/`. Production Pages: `/<repo>/`.

Env vars for CI: `GITHUB_PAGES=true`, `GITHUB_ORG`, `GITHUB_REPO`.

### Navbar (current)

| Label | Route |
|-------|-------|
| Wiki | doc sidebar |
| Graph | `/graph` |
| Dashboard | `/workspace` |
| Analytics | `/analytics` |
| LLM Wiki pattern | external Karpathy gist |

## Custom dashboard pages

### `/workspace` — `src/pages/workspace.js`

**Components:** `LiveBuild`, `SourceFolders`, `DataWorkspace`, `PageShell`, `PageHeader`

Redesigned (previously a flat gray/white layout with no visual distinction
between raw input and compiled output, and a single hardcoded `data/raw/`
directory with no way to add another folder). Features:

- Stat-card row (raw files processed, wiki pages, cross-links, dead links) via `fetchAnalytics`
- **Run compiler** bar (`LiveBuild`) — status badge, SSE stream from `/api/build/stream`, "Rebuild all files"
- **Source folders** (`SourceFolders`, new) — Explorer-style grid of registered source
  directories; add a folder by path, toggle it on/off, or remove it, without restarting
  anything. See "Source folder registry" below for how this reaches the compiler.
- **File explorer** (`DataWorkspace`, rewritten) — `data/raw/` browsed as an icon grid,
  like a desktop file manager, not a text list: folders and files as tiles, a breadcrumb
  bar to navigate, "New folder" to organize files into subfolders, and a per-file "…" menu
  with **Move to…** (any non-managed folder) and **Preview**. Raw content is never shown
  inline — a file's source text and the wiki page it produced only appear if you explicitly
  click **Preview**, which opens a modal (source in amber, generated wiki page in indigo);
  closing it returns you to the grid. Folders belonging to a registered source (see below)
  are visually marked and have no delete/move actions, since `sync_symlinks()` would just
  regenerate them on the next sync.
- Settings gear (top-right of every dashboard page, `PageHeader` → `SettingsPanel`) —
  override the compiler API URL from the browser (persisted to `localStorage`), see the
  raw data directory path

**Folder API:** `compiler/raw_folders.py`, backing `POST /api/raw-files/folders`
(create), `DELETE /api/raw-files/folders/{path}` (delete, only if empty), and
`POST /api/raw-files/move`. Every operand is checked for symlink-ness and
containment *before* being resolved, not after — resolving first and
checking second would follow a symlink to whatever it points at and
silently operate on that instead (caught directly: an early version did
exactly this and a "move" of a mirrored source file actually relocated
the real external file). Any path whose top segment is a registered
source's `link_name` is refused outright.

## Source folder registry

**Module:** `compiler/sources_registry.py` · **Registry file:** `data/sources.json` (gitignored, like `data/state.json`)

The compiler pipeline only ever reads from one hardcoded directory,
`RAW_DIR` (`data/raw/`) — that didn't change, and nothing in
`extraction.py`/`synthesizer.py`/etc. was touched. What's new is a way to
pull files in from *other* directories on disk without moving or copying
them: register a folder, and it's mirrored into `data/raw/<slug>/` as a
tree of **per-file symlinks**, one per real file, matching the external
folder's own structure.

**Why per-file symlinks and not one symlink to the folder:** the first
version did exactly that — one symlink at `data/raw/<slug>` pointing
straight at the external directory — and it silently didn't work.
`discover_raw_source_files()` (`synthesizer.py`) walks `RAW_DIR` with
`Path.rglob("*")`, and confirmed directly against the real filesystem: `rglob` does not
descend into a symlinked *directory*, so every file inside would have been
invisible to the compiler while still showing up fine in `ls`. Mirroring
one symlink per file sidesteps that — each file is its own top-level match
for `rglob`, so no change to `discover_raw_source_files()` was needed at
all.

`sync_symlinks()` re-derives `data/raw/`'s managed folders from
`data/sources.json` on every add, remove, enable/disable toggle, and
server startup — new files that appeared in a registered folder since the
last sync get a new symlink, files that vanished lose theirs. It only
ever touches names it manages (tracked by `link_name` in the registry);
a real file or folder placed directly under `data/raw/` by hand is never
touched.

**Endpoints:** `GET/POST /api/sources`, `PUT` / `DELETE /api/sources/{id}`.
**Caveat for Docker:** the path you register must be visible to the
`compiler-api` container's filesystem (e.g. an extra bind mount), not just
your host machine.

### `/graph` — `src/pages/graph.js`

**Component:** `WikiGraph` (`react-force-graph-2d`)

- Nodes: topics from `compiler/temp_output/index.json` (via API)
- Edges: cross-links detected in compiled markdown
- Force-directed layout, draggable nodes

### `/analytics` — `src/pages/analytics.js`

**Component:** `AnalyticsAudit`

- Compiler metrics summary
- Dead-link audit table
- Tag explorer — drill into raw chunks and pages per tag
- Uses `fetchKnowledgeGraph` internally for connection stats (no dedicated UI page)

## Shared UI components

Light theme, rounded-xl cards with a soft shadow (`shadow-card`/`shadow-card-hover`
in `tailwind.config.js`), a pill-style tab nav, and a consistent colour language:
**amber = source / raw / untouched** (`source` in `tailwind.config.js`),
**indigo = generated / compiled wiki output** (`generated`), emerald `accent`
for primary actions and "everything's fine" status.

| Component | Path | Role |
|-----------|------|------|
| `PageShell` | `components/PageShell/` | Page background (subtle gradient), max-width container |
| `PageHeader` | `components/PageHeader/` | Pill tab nav + title + description + Settings gear |
| `DashboardNav` | `components/ui/DashboardNav.js` | Dashboard / Chat / Emails / Resources / Graph / Analytics links |
| `Button` | `components/ui/Button.js` | `PrimaryButton`, `SecondaryButton`, `DangerGhostButton`, `IconButton`, `Switch`, `Badge` |
| `Icons` | `components/ui/Icons.js` | Small hand-rolled line-icon set (no icon library dependency) |
| `SourceFolders` | `components/SourceFolders/` | Explorer-style folder grid — add/enable/disable/remove source directories |
| `SettingsPanel` | `components/SettingsPanel/` | Slide-over: API URL override, data directory info |
| `DataWorkspace` | `components/DataWorkspace/` | Icon-grid file explorer for `data/raw/` — folders, breadcrumbs, move/create-folder, preview-on-demand modal |
| `LiveBuild` | `components/LiveBuild/` | Compile controls + status badge + terminal (`BuildTerminal.js`) |
| `WikiGraph` | `components/WikiGraph/` | Topic force graph |
| `AnalyticsAudit` | `components/AnalyticsAudit/` | Metrics, dead links, tags |
| `Backlinks` | `components/Backlinks/` | Backlinks on doc pages |

`useApiBase()` (`utils/useApiBase.js`) is the one hook every data-fetching
component now calls for the compiler API base URL — it reads a
`localStorage` override written by `SettingsPanel`, falling back to
`docusaurus.config.js`'s `customFields.wikiApiUrl` (the `WIKI_API_URL` env
var) when there isn't one. Previously every component computed this
inline from `useDocusaurusContext()`, with no way to change it without
rebuilding.

## API client

**File:** `src/utils/wikiApi.js`

| Export | Endpoint |
|--------|----------|
| `fetchRawFiles` | `GET /api/raw-files` |
| `fetchRawFileDetail` | `GET /api/raw-files/{path}` |
| `fetchDocDetail` | `GET /api/docs/{path}` |
| `fetchDocsList` | `GET /api/docs` |
| `buildStreamUrl` | `GET /api/build/stream?...` |
| `fetchBuildStatus` | `GET /api/build/status` |
| `fetchAnalytics` | `GET /api/analytics` |
| `fetchAnalyticsTag` | `GET /api/analytics/tags/{tag}` |
| `fetchKnowledgeGraph` | `GET /api/knowledge-graph` |
| `saveKnowledgeGraphOverrides` | `PUT /api/knowledge-graph/overrides` |

## Tailwind

**File:** `tailwind.config.js`

- `preflight: false` — avoids conflicting with Docusaurus global styles
- Dashboard pages use Tailwind utilities (`rounded-lg`, `border-gray-200`, etc.)

## Backlinks plugin

**File:** `plugins/backlinksPlugin.js`

Adds backlinks section to doc pages — shows which other pages link to the current page.

## npm scripts

```bash
npm start      # docusaurus start — dev :3000
npm run build  # production static site → build/
npm run serve  # preview build/
npm run clear  # clear Docusaurus cache
```

## Dependencies (high level)

- `@docusaurus/core`, `@docusaurus/preset-classic` ^3.7
- `react`, `react-dom` ^18
- `react-force-graph-2d` ^1.29
- `clsx` ^2.1
- `tailwindcss`, `postcss`, `autoprefixer` (dev)

## Next

- [12-api-server.md](./12-api-server.md)
- [16-troubleshooting.md](./16-troubleshooting.md) — dashboard errors

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

**Components:** `DataWorkspace`, `LiveBuild`, `PageShell`, `PageHeader`

Features:

- One-line metrics summary (raw files, wiki pages, dead links) via `fetchAnalytics`
- Shared tab nav (Dashboard | Graph | Analytics) in `PageHeader`
- Raw file list with processed / unprocessed filters and search
- Side-by-side raw content vs synthesized page preview when you open a file
- **Live compile** — SSE stream from `/api/build/stream` with optional “Rebuild all files”

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

The dashboard uses a flat layout: gray background, white bordered panels, simple text nav — no stat-card grids or heavy shadows.

| Component | Path | Role |
|-----------|------|------|
| `PageShell` | `components/PageShell/` | Gray page background, max-width container |
| `PageHeader` | `components/PageHeader/` | Tab nav + title + short description |
| `DashboardNav` | `components/ui/DashboardNav.js` | Dashboard / Graph / Analytics links |
| `Button` | `components/ui/Button.js` | Flat primary and secondary buttons |
| `DataWorkspace` | `components/DataWorkspace/` | Raw file list and source vs wiki preview |
| `LiveBuild` | `components/LiveBuild/` | Compile controls + terminal (`BuildTerminal.js`) |
| `WikiGraph` | `components/WikiGraph/` | Topic force graph |
| `AnalyticsAudit` | `components/AnalyticsAudit/` | Metrics, dead links, tags |
| `Backlinks` | `components/Backlinks/` | Backlinks on doc pages |

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

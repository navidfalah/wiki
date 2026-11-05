# 11 — Backend, Frontend, and Dashboards

**Paths:** `backend/` (Express + TypeScript API server), `frontend/` (Express + TypeScript + Tailwind server-rendered app)

## Why this replaced Docusaurus + a React dashboard

The site used to be two things stitched loosely together: a Docusaurus
static-doc-site rendering `wiki-app/docs/*.md` under `/docs/...`, plus a
separate React dashboard (`/workspace`, `/graph`, `/analytics`) bolted on
via Docusaurus's custom-pages escape hatch — different nav, different
layout conventions, and (the concrete complaint that triggered this
rewrite) the Docusaurus doc-sidebar view and the dashboard's own
"Dashboard" nav link both looked like separate apps, not one product.

This rewrite is a single Express+TypeScript **frontend** that renders
*both* the wiki pages and the dashboard through one layout and one nav
(`Wiki | Dashboard | Chat | Emails | Resources | Graph | Analytics`),
backed by a single Express+TypeScript **backend** API — Docusaurus and the
old React app are gone, not layered under the new stack.

The compiler, chat, email handling, connectors, and API services now run in
JavaScript/TypeScript. The Python implementation is being retired as its
remaining developer and evaluation workflows are migrated.

## Node services and JavaScript compiler

```
 browser
   │  GET /wiki/*, /dashboard, ...           (SSR pages)
   │  fetch/EventSource to :8000 directly     (client-side calls)
   ▼
frontend (Express+TS, :3000)  ──SSR fetch──▶  backend (Express+TS, :8000)
                                                    │
                                     run compiler/main.js
                                                    ▼
                                          compiler/ (JavaScript)
                                                    │
                                    reads/writes data/, wiki-app/docs/
```

The frontend never talks to the compiler directly — every fetch, including
the ones this server does itself while rendering a page (`frontend/src/api.ts`),
goes through the backend's REST API. The **only** thing frontend pages
fetch that isn't proxied through the backend's JSON API is the client-side
`EventSource` for the live build log and the client-side chat requests —
those hit the backend directly from the browser (see "Two backend URLs"
below).

## Backend (`backend/`)

**Entry point:** `src/index.ts` · **Port:** 8000 (`PORT` env var)

The current Node services and their retired Python equivalents are listed
below. The JavaScript implementation is the runtime source of truth:

| JavaScript/TS module | Replaced Python module | Notes |
|-----------|-------|-------|
| `sourcesRegistry.ts` | `sources_registry.py` | Symlink-mirror source folders into `data/raw/` |
| `rawFolders.ts` | `raw_folders.py` | Create/delete/move inside `data/raw/` |
| `rawFiles.ts` | `synthesizer.discover_raw_source_files` | File discovery + md5 status |
| `backend/src/lib/docUtils.ts` | `compiler/doc_utils.js` | Frontmatter parsing, doc payloads |
| `deadLinkChecker.ts` | `dead_link_checker.py` | Broken-link scan |
| `analytics.ts` | `analytics.py` | Metrics, tag registry, dead-link audit |
| `linkOverrides.ts` | `link_overrides.py` | Knowledge graph, connection overrides |
| `resourcesEngine.ts` | `resources_engine.py` (retired) | Cited-source dedup |
| `fsWalk.ts` | — | Shared directory-walk helper (see below) |
| `buildService.ts` | Compiler execution | JavaScript build coordination and SSE stream |

**A real bug found while porting, not a hypothetical:**
`fs.readdirSync(dir, { withFileTypes: true })`'s `Dirent.isFile()` /
`.isDirectory()` report the directory *entry's own* type — for a
symlink entry both are `false` regardless of what the link points at.
Every recursive walker here originally branched on those flags directly,
so every mirrored source file (which is entirely made of symlinks) was
silently invisible to `/api/raw-files`. Confirmed directly: added a
source folder through the running server, and `/api/raw-files` came back
without it. Fixed once, centrally, in `fsWalk.ts`'s `walkEntries()`
(uses `fs.statSync`, which follows symlinks, instead of trusting Dirent
flags) and wired into every walker that touches `data/raw/`.

### Compiler execution

The backend runs compilation, email handling, retrieval and connectors in JavaScript. See [the runtime migration guide](44-javascript-runtime-migration.md) for current coverage and limitations.

### Routes (`src/routes/index.ts`)

Same endpoint shapes the old FastAPI `server.py` exposed — `GET/POST/PUT/DELETE
/api/sources`, `GET /api/raw-files[/*]`, `POST /api/raw-files/folders`,
`DELETE /api/raw-files/folders/*`, `POST /api/raw-files/move`,
`GET /api/emails[/*]`, `GET /api/docs[/*]`, `GET /api/state`,
`GET /api/build/status`, `GET /api/build/stream`, `GET/PUT
/api/knowledge-graph[/overrides]`, `GET /api/analytics[/tags/:tag]`,
`GET /api/resources[/*]`, `POST /api/chat`, `GET /api/chat/status` — so
anything that talked to the old API base URL only needs the URL updated,
not its request/response shapes.

## Frontend (`frontend/`)

**Entry point:** `src/index.ts` · **Port:** 3000 (`PORT` env var) · **Views:** EJS (`src/views/`) · **Styling:** Tailwind (`tailwind.config.js`) · **Client interactivity:** hand-written TypeScript, bundled per-page with esbuild (`src/client/*.ts` → `dist-static/js/*.js`), no framework

### Routes

| Route | Renders | Client bundle |
|-------|---------|----------------|
| `/wiki` | every compiled page as a **file tile** in an icon grid (title + `.txt` badge), searchable — no content shown inline, matching the Resources file-explorer visual language | inline (search filter only) |
| `/wiki/:slug/download` | streams that page's raw markdown source with `Content-Disposition: attachment` — clicking a tile downloads it as `<slug>.txt`, nothing renders in the browser | — |
| `/dashboard` | home panel: search/Ask box (`Ask` opens `/chat?q=…` as a new conversation), four clickable status cards (pages → `/wiki`, sources compiled → `/resources`, items needing attention → `/review-queue`, last compile → `/pipelines`), quick actions, *Needs your attention* (per-kind counts from `/api/attention` with the action that fixes each), *Recently updated pages* (`modified_at` from `/api/docs`) and *Team activity* (`/api/activity` minus sign-ins and server housekeeping); below it the compiler workspace — run-compiler panel (SSE log) and source folders. Raw files are managed on `/resources` (Files tab), not here. Render functions live in `client/lib/dashboardHome.ts` (unit-tested) | `dashboard.ts` |
| `/chat` | ask a question, grounded answer + cited pages | `chat.ts` |
| `/emails` | ingested `.eml` list + detail modal | `emails.ts` |
| `/resources` | deduped cited-source list, searchable | `resources.ts` |
| `/graph` | **simplified from the previous version**: every topic and its outgoing links as a searchable list, not a force-directed canvas — the old `react-force-graph-2d` visualization isn't ported. A real follow-up if the visual graph is wanted back, not silently dropped. | `graph.ts` |
| `/analytics` | metrics, dead-link list, tag cloud | `analytics.ts` |

### App shell (`src/views/partials/head.ejs`, `foot.ejs`)

One persistent left sidebar (icon + label per section, active one
highlighted), one layout, included at the top/bottom of every view — this
is the actual fix for the "dashboard inside a dashboard" complaint:
`/wiki` and `/dashboard` are two entries in the *same* sidebar nav, not
two different site frames. The sidebar opens with a search box
(`#sidebar-search`, GET `/search`); pressing `/` on any page focuses the
page's own `[data-primary-search]` box if it has one (dashboard, search),
else the sidebar box — handled by a small inline script in `foot.ejs`. Collapses to a horizontally-scrolling bar
above the content on narrow screens (`md:` breakpoint switches from
`flex-col` to `flex-row` on the outer `<body>` wrapper) rather than a
hidden hamburger menu — there's only seven items, so it stays usable
without a toggle.

### Two backend URLs (important for Docker)

`frontend/src/config.ts` deliberately exposes two different values:

- **`BACKEND_API_URL`** — used by this server's own SSR fetches
  (`src/api.ts`, e.g. fetching a doc's body to render `/wiki/:slug`).
  Under Docker Compose this has to be the service hostname
  (`http://backend:8000`), reached over the Compose network.
- **`PUBLIC_API_URL`** — embedded into every page as
  `<meta name="api-base">`, read by every client bundle for its own
  `fetch`/`EventSource` calls. The browser runs on the *host*, not the
  Docker network, so it needs the host-published URL
  (`http://localhost:8000`).

Collapsing these into one variable works for local (non-Docker) dev,
where both happen to be `http://localhost:8000` — and breaks silently
under Docker Compose, where `backend` only resolves inside the container
network. `docker-compose.yml` sets both explicitly; local dev can leave
both unset and get the same default for each.

### Wiki pages are files, not rendered text — no preview at all

`/wiki` doesn't render markdown to HTML, and as of this iteration doesn't
show page content in the browser at all, not even as raw text in a
`<pre>` block (an intermediate version did that; the user's explicit
follow-up was "do not show me the text in the file only keep it like the
files in the directory"). It's a grid of file tiles — the same visual
language as the Resources file explorer — and clicking one downloads
it; there is no per-page detail view anymore. No `marked` dependency, no
link rewriting, no heading-anchor TOC, no `not-found.ejs` (nothing left
to 404 into once there's no per-page route) — all removed along with the
`marked` and `@tailwindcss/typography` packages once nothing referenced
them. `/wiki/:slug/download` streams the raw content back
with `Content-Type: text/plain` and a `Content-Disposition: attachment`
header, so it saves as a real `.txt` file.

## Source folder registry (unchanged behavior, now backing a TS route)

**Module:** `backend/src/lib/sourcesRegistry.ts` · **Registry file:** `data/sources.json`
(gitignored, like `data/state.json`)

The compiler pipeline only ever reads from one hardcoded directory,
`RAW_DIR` (`data/raw/`) — that didn't change. What the dashboard's
"Source folders" panel does is register a folder living *elsewhere* on
disk, mirrored into `data/raw/<slug>/` as a tree of **per-file symlinks**
matching the external folder's structure — never one symlink to the whole
directory (`Path.rglob()`/`fs.readdirSync()` recursion doesn't descend
into a symlinked *directory*, in both Python and the Node port; see the
Dirent bug above for the Node-specific version of the same underlying
gotcha).

`syncSymlinks()` re-derives `data/raw/`'s managed folders from
`data/sources.json` on every add, remove, enable/disable toggle, and
server startup. It only ever touches names it manages (tracked by
`link_name`); a real file or folder placed directly under `data/raw/` is
never touched.

**Endpoints:** `GET/POST /api/sources`, `PUT`/`DELETE /api/sources/{id}`.
**Caveat for Docker:** the path you register must be visible to the
`backend` container's filesystem (e.g. an extra bind mount), not just
your host machine.

## File explorer + folder API

**Module:** `backend/src/lib/rawFolders.ts` (ported from
`compiler/raw_folders.py`), backing `POST /api/raw-files/folders`
(create), `DELETE /api/raw-files/folders/{path}` (delete, only if empty),
and `POST /api/raw-files/move`. Every operand is checked for symlink-ness
and containment *before* being resolved, not after — resolving first
would follow a symlink to whatever it points at and silently operate on
the real target instead of refusing (the Python original already got
this right; the TS port re-verified it with the same test case). Any path
whose top segment is a registered source's `link_name` is refused
outright, since `syncSymlinks()` would just regenerate it.

## Tailwind

**File:** `frontend/tailwind.config.js` — same colour language as the
previous React version: **amber `source`** = raw/untouched input,
**indigo `generated`** = compiled wiki output, emerald `accent` for
primary actions.

## npm scripts

```bash
# backend/
npm run dev:server   # tsx watch src/index.ts
npm run build        # tsc -> dist/
npm start            # node dist/index.js

# frontend/
npm run dev:server   # tsx watch src/index.ts
npm run dev:css      # tailwindcss --watch
npm run dev:client   # esbuild --watch (client bundles)
npm run build        # css + client + server -> dist/, dist-static/
npm start            # node dist/index.js
```

## Dependencies (high level)

- **backend/**: `express`, `cors` — no ORM/database, everything is
  filesystem/JSON, same as the Python engines it ports
- **frontend/**: `express`, `ejs` — no markdown-rendering dependency
  (wiki pages are shown as raw text) and no client framework;
  `dist-static/js/*` are hand-written TypeScript bundled with `esbuild`,
  styled with Tailwind

## Next

- [12-api-server.md](./12-api-server.md)
- [16-troubleshooting.md](./16-troubleshooting.md) — dashboard errors

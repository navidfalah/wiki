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

**What did *not* change:** the Python compiler pipeline
(`compiler/main.py` and every module it calls — extraction, synthesis,
linking, MOC generation) is untouched, same code, same tests. Retrieval
for chat (`rag_engine.py`, hybrid BM25 + embeddings + reranking + LLM
calls) and `.eml` parsing + trust resolution (`email_engine.py`) also stay
Python deliberately — reimplementing IR/NLP and MIME parsing from scratch
in a rewrite is exactly the kind of work that produces a worse, silently
different system, not a faster one. The Node backend reaches these
through `compiler/cli.py`, a thin subprocess bridge (see "Python bridge"
below).

## Two Node services, one Python compiler

```
 browser
   │  GET /wiki/*, /dashboard, ...           (SSR pages)
   │  fetch/EventSource to :8000 directly     (client-side calls)
   ▼
frontend (Express+TS, :3000)  ──SSR fetch──▶  backend (Express+TS, :8000)
                                                    │
                                     spawn python3 main.py / cli.py
                                                    ▼
                                          compiler/ (Python, unchanged)
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

Ported module-for-module from the Python `compiler/` engines, in
`src/lib/`:

| TS module | Ports | Notes |
|-----------|-------|-------|
| `sourcesRegistry.ts` | `sources_registry.py` | Symlink-mirror source folders into `data/raw/` |
| `rawFolders.ts` | `raw_folders.py` | Create/delete/move inside `data/raw/` |
| `rawFiles.ts` | `synthesizer.discover_raw_source_files` | File discovery + md5 status |
| `docUtils.ts` | `doc_utils.py` | Frontmatter parsing, doc payloads |
| `deadLinkChecker.ts` | `dead_link_checker.py` | Broken-link scan (balanced-parens regex fix included) |
| `analytics.ts` | `analytics.py` | Metrics, tag registry, dead-link audit |
| `linkOverrides.ts` | `link_overrides.py` (read/CRUD surface) | Knowledge graph, connection overrides |
| `resourcesEngine.ts` | `resources_engine.py` | Cited-source dedup |
| `fsWalk.ts` | — | Shared directory-walk helper (see below) |
| `pythonBridge.ts` | `build_runner.py` + new | Build SSE stream, `cli.py` subprocess calls |

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

### Python bridge (`src/lib/pythonBridge.ts`, `compiler/cli.py`)

- `streamCompilerBuild()` spawns `python3 -u main.py [--force]` with
  `cwd: compiler/`, streams stdout/stderr as Server-Sent Events — the
  same shape `build_runner.py` used to produce for FastAPI, just spawned
  from Node instead of `asyncio.subprocess`.
- `runCli(command, input)` spawns `python3 cli.py <command>`, writes JSON
  to stdin, reads one JSON object from stdout. `compiler/cli.py` has four
  subcommands: `chat`, `chat-status` (both call `rag_engine.py`),
  `emails-list`, `email-detail` (both call `email_engine.py`). Verified
  directly against the real corpus before wiring the Express routes to
  it — all four return real data (see `compiler/cli.py`'s own tests via
  manual invocation in this repo's history, or run
  `echo '{"message":"..."}' | python3 cli.py chat` yourself).

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
| `/wiki` | redirects to `/wiki/index` | — |
| `/wiki/:slug` | one compiled page shown as **raw text**, not rendered HTML — a `<pre>` block of the page's actual markdown source, plus a Download button (`/wiki/:slug/download`, `Content-Disposition: attachment`); left sidebar (all pages, alphabetical, client-side filtered) | inline (search filter only) |
| `/dashboard` | stat cards, run-compiler panel (SSE log), source folders grid, file-explorer grid (same feature set as the previous React `DataWorkspace`/`SourceFolders`: breadcrumbs, create/delete folder, move file, preview-on-demand modal) | `dashboard.ts` |
| `/chat` | ask a question, grounded answer + cited pages | `chat.ts` |
| `/emails` | ingested `.eml` list + detail modal | `emails.ts` |
| `/resources` | deduped cited-source list, searchable | `resources.ts` |
| `/graph` | **simplified from the previous version**: every topic and its outgoing links as a searchable list, not a force-directed canvas — the old `react-force-graph-2d` visualization isn't ported. A real follow-up if the visual graph is wanted back, not silently dropped. | `graph.ts` |
| `/analytics` | metrics, dead-link list, tag cloud | `analytics.ts` |

### App shell (`src/views/partials/head.ejs`, `foot.ejs`)

One nav, one layout, included at the top/bottom of every view — this is
the actual fix for the "dashboard inside a dashboard" complaint: `/wiki`
and `/dashboard` are two links in the *same* pill nav, not two different
site frames.

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

### Wiki pages are shown as raw text, deliberately

`/wiki/:slug` does **not** render markdown to HTML — it fetches the
page's raw body from the backend and puts it straight into a `<pre>`
block, at the user's explicit request ("I don't want to see the actual
text[, rendered,] but the files in the txt format"). No `marked`
dependency, no link rewriting, no heading-anchor TOC — those all existed
in an earlier version of this file and were removed along with the now-
unused `marked` and `@tailwindcss/typography` packages once nothing
referenced them. `/wiki/:slug/download` streams the same content back
with `Content-Type: text/plain` and a `Content-Disposition: attachment`
header, so it saves as a real `.txt` file.

## Source folder registry (unchanged behavior, now backing a TS route)

**Module:** `backend/src/lib/sourcesRegistry.ts` (ported from
`compiler/sources_registry.py`) · **Registry file:** `data/sources.json`
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

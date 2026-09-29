# 12 — API Server

**Path:** `backend/` (Express + TypeScript)
**Start:** `cd backend && npm run dev:server` (dev) or `npm start` after `npm run build` (production)
**Default URL:** http://localhost:8000

Everything below describes the request/response *shapes*, which are
unchanged from the previous FastAPI implementation (`compiler/server.py`,
now retired) — only the runtime changed. See
[11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md) for how
the endpoints are implemented (which are genuine TypeScript ports vs.
which bridge to Python via `compiler/cli.py`).

## Stack

- Express 4 + TypeScript, run via `tsx` in dev / compiled with `tsc` for production
- CORS enabled for `localhost:3000`, `127.0.0.1:3000`
- `main.py` (the compile) and `rag_engine.py`/`email_engine.py` (chat,
  email parsing) are invoked as `python3` subprocesses — see
  `backend/src/lib/pythonBridge.ts`

## Health

```
GET /api/health
→ {"status": "ok"}
```

## Raw files

### List

```
GET /api/raw-files
```

Returns all `.txt`/`.md` under `data/raw/` with:

- `path` — relative path
- `status` — `Processed` or `Unprocessed` (MD5 match in state)
- `size_bytes`
- `md5` (truncated display in list)

### Detail

```
GET /api/raw-files/{file_path:path}
```

Path segments URL-encoded (slashes preserved via encoding per segment).

Returns:

| Field | Description |
|-------|-------------|
| `content` | Full raw file text |
| `status` | Processed / Unprocessed |
| `md5` | Full hex digest |
| `processed_at` | From state |
| `topics`, `entities`, `concepts` | Aggregated from chunks |
| `chunks` | Per-chunk extraction metadata |
| `synthesized_pages` | Guessed wiki pages for extracted topics |

Path traversal blocked via `safePath()` (`backend/src/routes/index.ts`) — must resolve under `RAW_DIR`.

## Generated docs

### List

```
GET /api/docs
```

Scans `wiki-app/docs/**/*.md`, parses front matter for `title`, `slug`, `tags`, `page_type`.

### Detail

```
GET /api/docs/{doc_path:path}
```

Returns:

- `content` — full markdown
- `frontmatter` — parsed YAML fields
- `outbound_links` — extracted `[text](href)` pairs

## Compiler state

```
GET /api/state
```

Returns `data/state.json` contents or empty scaffold if missing:

```json
{"version": 1, "files": {}, "runs": []}
```

**Note:** State lives at repo root `data/state.json`, not under `compiler/`.

## Live build (SSE)

### Status

```
GET /api/build/status
→ {"running": true|false}
```

### Stream

```
GET /api/build/stream?force=false
```

**Content-Type:** `text/event-stream`

**Events (JSON in `data:` field):**

| type | payload |
|------|---------|
| `start` | `message`, `command` |
| `log` | `message` (one line of compiler output) |
| `done` | `code`, `success`, `message` |
| `error` | `message` |

**Concurrency:** Only one build at a time. Second request → HTTP **409** `"A build is already running"`.

**Implementation:** `backend/src/lib/pythonBridge.ts`'s `streamCompilerBuild()` spawns `python3 -u main.py` with an optional `--force` flag (same shape the old `build_runner.py` produced). Strips ANSI codes from Rich terminal output. The backend process must have `OPENAI_API_KEY` set in its environment — `main.py` is LLM-only and exits `1` immediately otherwise.

## Knowledge graph

```
GET /api/knowledge-graph
```

Returns:

- `topics` — from `index.json`
- `detected_links` — parsed from compiled markdown
- `connections` — manual overrides from `link_overrides.json`
- `effective_links` — merged graph
- `outgoing_by_topic`
- `overrides_path`, `updated_at`

Empty index → topics `[]` but still returns override metadata.

```
PUT /api/knowledge-graph/overrides
Body: {"connections": [...]}
```

- Validates topics exist in `index.json`
- Saves to `data/link_overrides.json`
- Returns updated graph payload
- **400** if no topics in index (compile first)

## Analytics

```
GET /api/analytics
```

Summary metrics, tag index, dead-link audit (via `analytics.py` + `dead_link_checker.py`).

```
GET /api/analytics/tags/{tag}
```

Raw chunks and compiled pages for a normalized tag slug. **404** if tag unknown.

## Review report

```
GET /api/review-report
```

Contents of `compiler/review_report.txt` if `reviewer.py` was run. Otherwise `exists: false`.

## Authentication

Every `/api/*` route except `/api/health` and `/api/auth/login` needs
`Authorization: Bearer <token>`, where the token is either:

- **a login session** — `POST /api/auth/login {username, password}` →
  `{token, user}`. The browser never sees it: the frontend keeps it in an
  HttpOnly cookie and its `/api` proxy adds the header. Sessions last 30
  days and are revoked on logout, password reset, role change and user
  deletion.
- **a personal API token** (`wsb_…`) — for scripts and tools such as the
  MCP server (`mcp/`). Created on the Settings page or with the endpoints
  below; only its SHA-256 is stored, and the value is shown once.

| Token scope | Allowed | Notes |
|---|---|---|
| `read` (default) | `GET`/`HEAD` only | search, pages, sources, graph; writes get `403` |
| `write` | everything the owner can do | |

A token always acts with its owner's *current* role (no snapshot), stops
working when it expires or its owner is deleted, and can't create, list or
revoke tokens (those routes need a login session, so a leaked token can't
mint more). In production the backend is not published; clients use the
public site's `/api` proxy, which passes a client's own `Authorization`
header through when there is no session cookie:

```bash
curl -H "Authorization: Bearer wsb_…" https://wissensbau.de/api/search?q=battery
```

```
GET    /api/auth/me          → {user, auth: {method: "session"} | {method: "token", scope}}
GET    /api/tokens           → {tokens: [{id, name, scope, prefix, created_at, expires_at, last_used_at, expired}]}
POST   /api/tokens           {name, scope?: "read"|"write", expires_in_days?: 1-3650} → 201 {token, record}
DELETE /api/tokens/:id       → {revoked: true, id}
```

Tokens live in `data/api_tokens.json` (gitignored, included in backups).

## Compile reports

```
GET /api/pipelines              → each run has `changes` (page totals) or null
GET /api/pipelines/:id/changes  → {report: {totals, pages: [{path, title, status, lines_added, lines_removed}], truncated} | null}
```

See [45-page-version-history.md](./45-page-version-history.md#what-changed-in-each-compile).

## Scheduled sync (admin)

```
GET  /api/admin/sync           → {settings, running, last_run, next_run_at, runs}
PUT  /api/admin/sync/settings  {enabled, interval_hours, compile_after_sync, connections}
POST /api/admin/sync/run       → 202 {started: true}
```

See [48-scheduled-sync.md](./48-scheduled-sync.md).

## Security notes

- Path parameters are validated to stay within `RAW_DIR` and `OUTPUT_DIR`.
- Login attempts are throttled per client IP and per username.
- Admin-only routes (user management, backups) check the role on every
  request.
- In production the backend container only `expose`s port 8000 to the
  frontend; it is not reachable from outside.

## Next

- [11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md)
- [14-workflows.md](./14-workflows.md)

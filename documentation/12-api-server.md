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

## Security notes

- Local dev server binds `0.0.0.0:8000` — not hardened for public exposure
- Path parameters validated to stay within `RAW_DIR` and `OUTPUT_DIR`
- No authentication — intended for localhost only

## Next

- [11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md)
- [14-workflows.md](./14-workflows.md)

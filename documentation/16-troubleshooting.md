# 16 — Troubleshooting

## Python / virtualenv

**Symptom:** `ModuleNotFoundError` for `openai`, `rich`, etc.

```bash
cd compiler
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run compiler commands from `compiler/` with venv active, or use `build_wiki.sh`.

## No raw files found

```
No raw files found under data/raw/
```

Ensure at least one `.txt` or `.md` exists under `data/raw/`:

```bash
cd compiler && python scripts/dev/generate_junk_data.py
```

## YAML front matter errors

The frontend's markdown rendering can choke on titles with `:`, `#`, or special chars if the YAML itself is malformed.

```bash
cd compiler
python fix_frontmatter.py
# or
python main.py --force
```

## Dashboard: "Cannot reach API"

**Cause:** backend not running.

```bash
cd backend && npm run dev:server
curl http://localhost:8000/api/health
```

Two different URLs are involved (see
[11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md)'s "Two
backend URLs" section) — `BACKEND_API_URL` (frontend's own server-side
fetches) and `PUBLIC_API_URL` (embedded in the page for the browser's own
fetch/EventSource calls). Under Docker Compose these must differ
(`http://backend:8000` vs `http://localhost:8000`); for local (non-Docker)
dev, leaving both unset defaults both to `http://localhost:8000`, which
is correct.

Set at start time if needed:

```bash
BACKEND_API_URL=http://localhost:8000 PUBLIC_API_URL=http://localhost:8000 npm run dev:server
```

## Module not found (`npm run dev:server` / `npm run build`)

```bash
cd backend && npm install   # or cd frontend && npm install
```

## `npm run dev:server` fails / port in use

```bash
cd frontend
npm install
PORT=3001 npm run dev:server    # or free port 3000
```

Kill the process on the conflicting port if needed.

## Build already running (HTTP 409)

Only one SSE compile at a time (`backend/src/lib/pythonBridge.ts`'s
in-memory lock). Wait for completion or restart the backend to release it.

## Slow compiles

| Cause | Fix |
|-------|-----|
| 1000+ raw files | Use incremental runs (no `--force`) |
| LLM latency | Keep `data/.llm-cache.sqlite` around; avoid `--force` |
| Large varied samples | Expected — chunk count scales with size |

## `state.json` corruption

```bash
rm data/state.json
cd compiler && python main.py --force
```

## Empty or stale `index.json`

```bash
cd compiler && python main.py --force
```

`index.json` lives in `compiler/temp_output/`. API knowledge-graph endpoints need it.

## GitHub Pages broken links

Production uses `baseUrl: /<repo>/`. Local uses `/`. Links in compiler output use relative `./file.md` — usually fine. External absolute `/docs/...` links may break on Pages.

## MDX parse errors from junk data

Compiler runs `mdx_sanitize.py` on export. If manual edits introduce raw `<` or invalid JSX:

- Recompile affected pages
- Or run `fix_mdx_body.py` if applicable

## LLM errors

| Error | Fix |
|-------|-----|
| `No OPENAI_API_KEY set` / `OPENAI_API_KEY is required` | The compiler is LLM-only — there is no heuristic fallback. Add a key to `.env` (local) or set the `OPENAI_API_KEY` repo secret (CI). |
| Rate limit | Wait; cache reduces repeat calls |
| Invalid JSON from LLM | Retry; check model compatibility |

Clear cache: `rm data/.llm-cache.sqlite`

## Legacy `.compiler-state.json` (removed)

This file has been deleted. Use `data/state.json` for incremental compile state.

Not used by current pipeline. Confusion with `data/state.json` — see [10-data-layout-and-state.md](./10-data-layout-and-state.md).

## Stale CSS/JS in the browser

The frontend doesn't hash its static asset filenames, so a browser cache
can serve stale `app.css`/`dashboard.js` after a rebuild — hard-refresh,
or rebuild and restart:

```bash
cd frontend && npm run build && npm start
```

## Next

- [02-getting-started.md](./02-getting-started.md)
- [12-api-server.md](./12-api-server.md)

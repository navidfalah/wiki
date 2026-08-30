# 16 — Troubleshooting

## Python / virtualenv

**Symptom:** `ModuleNotFoundError` for `openai`, `rich`, etc.

```bash
cd compiler
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run compiler commands from `compiler/` with venv active, or use `build_wiki.sh` / `run_server.sh`.

## No raw files found

```
No raw files found under data/raw/
```

Ensure at least one `.txt` or `.md` exists under `data/raw/`:

```bash
cd compiler && python scripts/dev/generate_junk_data.py
```

## YAML front matter errors

Docusaurus build fails on titles with `:`, `#`, or special chars.

```bash
cd compiler
python fix_frontmatter.py
# or
python main.py --force
```

## Dashboard: "Could not reach the wiki API"

**Cause:** API server not running.

```bash
cd compiler && ./run_server.sh
curl http://localhost:8000/api/health
```

Check `wiki-app/docusaurus.config.js` → `customFields.wikiApiUrl` matches your API host.

Set at build time if needed:

```bash
WIKI_API_URL=http://localhost:8000 npm start
```

## `clsx` module not found

```bash
cd wiki-app && npm install
```

## `npm start` fails / port in use

```bash
cd wiki-app
npm run clear
npm install
npm start    # default :3000
```

Kill process on port 3000 if occupied.

## Build already running (HTTP 409)

Only one SSE compile at a time. Wait for completion or restart API server to release lock.

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

## Docusaurus cache weirdness

```bash
cd wiki-app && npm run clear && npm start
```

## Next

- [02-getting-started.md](./02-getting-started.md)
- [12-api-server.md](./12-api-server.md)

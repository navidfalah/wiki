# 15 — CI/CD and Deployment

## GitHub Actions

**Workflow:** `.github/workflows/pr-checks.yml`
**Triggers:** pull requests to `main`, pushes to `main`, manual dispatch

| Job | What it checks |
|---|---|
| `compiler` (Python 3.10 and 3.12) | `ruff check` with a pinned ruff version, `pytest`, and the offline eval regression gate `python eval_gate.py` (doc 14, doc 44) |
| `backend` | eslint, `tsc`, vitest (including the search benchmark floor), build |
| `frontend` | eslint (`src` + `test`), `tsc` (server, client bundles, tests), i18n key parity, vitest unit tests, build |
| `e2e` | Starts the real backend and frontend and runs Playwright in Chromium (`frontend/test/e2e`). Every page must load without a script error or CSP violation. Search must return results and link to pages. Raw previews must be `nosniff`. On failure the HTML report is uploaded. |
| `docker` | Validates the production compose file (with and without the Caddy profile) and the Caddyfile, and builds the images |

Run the browser smoke test locally:

```bash
cd frontend && npm run build
# Uses running servers if present; otherwise starts both itself.
E2E_USERNAME=admin E2E_PASSWORD=<your admin password> npm run test:e2e
```

The old GitHub Pages workflow (`wiki-build.yml`, a static Docusaurus deploy)
was removed. Production runs the Docker stack described in
[40-production-deployment.md](./40-production-deployment.md).

## Local production build

```bash
./build_wiki.sh
./build_wiki.sh --force
```

Output: `wiki-app/build/`

Preview:

```bash
cd wiki-app && npm run serve
```

## baseUrl behavior

| Environment | `baseUrl` |
|-------------|-----------|
| Local `npm start` | `/` |
| GitHub Pages build | `/<repo>/` |

Broken link warnings in build logs may reference path-prefix mismatches between local and Pages — check `docusaurus.config.js`.

## What gets deployed

| Included | Excluded |
|----------|----------|
| Compiled `wiki-app/docs/` markdown | `data/raw/` |
| Docusaurus static assets | API server |
| Dashboard React pages (static bundle) | `data/state.json` |
| | Live SSE compile (needs backend) |

Dashboard pages will load but show API errors on GitHub Pages unless you host a separate API and set `WIKI_API_URL` at build time.

## Manual deploy alternative

```bash
./build_wiki.sh --force
# Upload wiki-app/build/ to any static host (S3, Netlify, etc.)
```

## Next

- [02-getting-started.md](./02-getting-started.md)
- [13-configuration.md](./13-configuration.md)

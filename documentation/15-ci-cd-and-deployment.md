# 15 — CI/CD and Deployment

## GitHub Actions

**Workflow:** `.github/workflows/pr-checks.yml`
**Triggers:** every push to every branch, pull requests to `main`, manual dispatch

Every job installs its dependencies and then runs the repository's
`./wiki` CLI. The CLI is the same command developers run locally, so CI
and local runs cannot drift apart. Full reference:
[46-cli-and-testing.md](./46-cli-and-testing.md).

| Job | Runs | What it checks |
|---|---|---|
| `compiler` (Python 3.10 and 3.12) | `./wiki ci --only compiler` | `ruff` (pinned; also lints the CLI), `pytest` with a coverage floor, the offline eval regression gate (doc 14, doc 44) |
| `backend` | `./wiki ci --only backend` | eslint, `tsc`, vitest with a coverage floor (units, route integration tests, search benchmark floor), build |
| `frontend` | `./wiki ci --only frontend` | eslint, `tsc` (server, client bundles, tests) with i18n key parity, vitest with a coverage floor, build |
| `e2e` | `./wiki e2e` | Starts the real backend and frontend and runs Playwright in Chromium (`frontend/test/e2e`). Every page must load without a script error or CSP violation. Also checks search deep links, page history, backups and the dashboard. On failure the HTML report is uploaded. |
| `docker` | `./wiki docker` | Validates the production compose file (with and without the Caddy profile) and the Caddyfile, and builds the images |

On CI, a step whose prerequisite is missing fails instead of being skipped.
Each job writes a results table to the run's summary page.

Run the same checks locally:

```bash
./wiki ci --parallel            # compiler + backend + frontend, as CI does
E2E_PASSWORD=<your admin password> ./wiki e2e   # reuses running servers if present
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

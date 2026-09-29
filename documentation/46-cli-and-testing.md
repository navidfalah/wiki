# 46 — The `./wiki` CLI and the test suites

One command line for developing, testing and checking all four packages
(`compiler/` Python, `backend/` Express/TS, `frontend/` Express/EJS/TS,
`mcp/` the MCP server, doc 47).
It is a single standard-library Python script at the repository root
(`./wiki`, Python 3.10+), and it is exactly what GitHub Actions runs, so a
green `./wiki ci` locally means a green CI job.

## Commands

| Command | What it does |
|---|---|
| `./wiki doctor` | Checks Python, Node, npm, installed `node_modules`, Playwright's Chromium and (optionally) Docker. Tells you what is missing. |
| `./wiki setup [--browsers]` | `pip install -r compiler/requirements-dev.txt`, `npm ci` in backend, frontend and mcp, and Chromium for Playwright with `--browsers`. |
| `./wiki check [--changed]` | The fast pre-push check: lint, typecheck and unit tests. |
| `./wiki test [PKG] [-k EXPR]` | Unit tests. `-k` is a pytest `-k` expression for the compiler, a file filter for vitest. |
| `./wiki coverage [PKG]` | Tests with coverage, failing below the floors (see below). |
| `./wiki lint` / `typecheck` / `build` / `audit` | One stage across the selected packages. `audit` is `npm audit --omit=dev` plus `pip-audit` for the compiler (skipped locally until `pip install pip-audit`). |
| `./wiki eval [--update-baseline]` | Offline eval regression gate (`compiler/eval_gate.py`, doc 14). |
| `./wiki bench` | Q&A retrieval benchmark (doc 44) and the search benchmark. |
| `./wiki e2e [-- ARGS]` | Builds the frontend and runs the Playwright suite. It reuses servers already on :8000/:3000, or starts both. Pass `E2E_PASSWORD` for an existing admin. |
| `./wiki docker` | Validates the production compose file (with and without `--profile caddy`) and the Caddyfile, and builds the images. |
| `./wiki ci [--only PKG] [--e2e] [--docker]` | Everything CI runs, per package: lint → typecheck → coverage → eval gate (compiler) → build. |
| `./wiki dev` | Starts backend (:8000) and frontend (:3000) together. Ctrl-C stops both. |
| `./wiki list` | Every step and the exact command it runs, plus the coverage floors. |

Common flags:

- **Package selection:** `--only compiler,backend` (repeatable) or
  `--changed [--base origin/main]`, which picks only packages touched since
  the merge base (committed plus untracked). A change to `.github/`, `data/`
  or the CLI itself selects everything.
- **Running:** `--parallel` runs packages side by side (steps within a
  package stay in order), `--fail-fast` stops at the first failure,
  `-v` streams every step's output.
- **Output:** `--dry-run` prints the commands without running them, and
  `--json report.json` writes a machine-readable report.

Every command ends with a timed summary table and exits non-zero if a step
failed. Locally, a step whose prerequisite is missing (no `node_modules`, no
Docker) is **skipped** with a hint. On CI (`GITHUB_ACTIONS=true`) a skip
**fails** the run, because it means the job is misconfigured. There, each
step's log is also a collapsible group and the summary table is appended to
the job's step summary page.

```bash
./wiki setup --browsers        # once
./wiki check --changed         # before every push
./wiki ci --parallel           # the full CI run (~80 s)
./wiki e2e                     # browser suite
```

## CI (`.github/workflows/pr-checks.yml`)

The workflow runs on **every push to every branch**, on pull requests to
`main`, and on manual dispatch. Each job installs its dependencies and then
makes one CLI call:

| Job | Call |
|---|---|
| `compiler` (Python 3.10 and 3.12) | `./wiki ci --only compiler` |
| `backend` | `./wiki ci --only backend` |
| `frontend` | `./wiki ci --only frontend` |
| `mcp` | `./wiki ci --only mcp` |
| `e2e` | `./wiki e2e` (the HTML report is uploaded on failure) |
| `docker` | `./wiki docker` |

To add a check, add a step to the CLI (and a test in
`compiler/tests/test_wiki_cli.py`). The workflow does not need to change.

## Coverage floors

Coverage is measured on source only: tests, fixtures, scripts and entry
points that only bind a port are excluded (`compiler/pyproject.toml`
`[tool.coverage]`, `backend/vitest.config.ts`, `frontend/vitest.config.ts`).
The floors live in `COVERAGE_FLOORS` in `./wiki`. They sit a little below
the measured value, so a PR that deletes tests or adds untested code fails.
Raise them when coverage goes up.

Frontend coverage looks low overall (about 16%) because it counts the page
scripts in `frontend/src/client/*.ts`. These are DOM-heavy and exercised
by the Playwright suite in a real browser, not by unit tests. The server
code and the shared client libraries are at 90–100%.

## What is tested where

| Package | Suite | Highlights |
|---|---|---|
| compiler | `compiler/tests/` (pytest) | Pipeline stages, linker, ingest formats, connectors, eval gate, and the CLI itself (`test_wiki_cli.py`). **`test_pipeline_e2e.py`** compiles a tiny raw folder end to end with a scripted LLM, with every data path redirected to `tmp_path`. It covers pages, References, cross-links, the index and state, then checks that an unchanged re-run does no LLM work, an edited file is the only one re-extracted, and a provider failure marks the run failed. `test_cli_commands.py` covers every `cli.py` bridge command's validation and error types. Tests that start `cli.py`/`main.py` as subprocesses are measured too (`[tool.coverage.run] patch = ["subprocess"]`). A session guard in `conftest.py` fails the run if any test changes the real `data/`, `wiki-app/docs/` or `temp_output/`. |
| backend | `backend/src/**/*.test.ts` (vitest) | Library units, plus **route integration tests** (`src/routes/*.routes.test.ts`). These boot the real Express app from `createApp()` against a throwaway data root (`WIKI_DATA_ROOT`), with a fake Python bridge (`__fixtures__/fakePython.cjs`) standing in for `compiler/cli.py`. They cover auth and roles, docs/history/search, files and uploads (path traversal, sandbox headers), settings masking, backups, and the SSE compile and chat streams. |
| frontend | `frontend/test/unit/` (vitest; happy-dom, server tests in node) | **Server** (`server.test.ts`): the real app from `createApp()` in front of a stub backend. Covers security headers and per-request CSP nonces on every inline script, the login gate and `?next=` open-redirect guard, login/throttle/logout, admin-only pages, wiki list/page/edit/history/download with escaped bodies, generic 500s that leak no internals, the `/api` proxy (cookie → bearer, spoofed `X-Client-IP` overwritten, SSE streaming), language switching, and script-context escaping of URL values. **Client** libraries: i18n, `apiFetch`, `escapeHtml` (attribute-safe), cache and offline banner, server-text mapping, modal a11y, copy buttons, the search page (escaping, links, filters, debounce), and the dashboard home renderers. |
| mcp | `mcp/src/**/*.test.ts` (vitest) | The tools tested through a real MCP client over the SDK's in-memory transport against a stubbed wiki API: tool list and schemas, read-only annotations, GET-only requests with the bearer token, result formatting and truncation, and error results (rejected token, 404 advice, unreachable host without leaking the token). |
| end to end | `frontend/test/e2e/smoke.spec.ts` (Playwright) | Every page loads without script errors or CSP violations. Also covers search deep links, page history edit/diff/restore, backups, and the dashboard (status cards, the `/` shortcut, Ask → new chat). |

# 15 — CI/CD and Deployment

Three workflows and a Dependabot configuration, all under `.github/`:

| File | When | Purpose |
|---|---|---|
| `workflows/pr-checks.yml` (**Checks**) | every push to every branch, PRs to `main`, manual | lint, types, tests, coverage floors, eval gate, e2e, Docker build |
| `workflows/deploy.yml` (**Deploy**) | after Checks passes on `main`, manual | deploy to the production server (off until configured) |
| `workflows/audit.yml` (**Dependency audit**) | weekly, on lockfile changes on `main`, manual | known vulnerabilities in production dependencies |
| `dependabot.yml` | weekly (actions and Docker base images monthly) | update PRs for npm, pip, GitHub Actions and Docker base images |

All actions use their Node 24 majors (`actions/checkout@v6`,
`setup-node@v6`, `setup-python@v6`, `upload-artifact@v6`); Node 20 actions
are deprecated on GitHub-hosted runners.

## Checks

Every job installs its dependencies and then runs the repository's
`./wiki` CLI. The CLI is the same command developers run locally, so CI
and local runs cannot drift apart. Full reference:
[46-cli-and-testing.md](./46-cli-and-testing.md).

| Job | Runs | What it checks | Timeout |
|---|---|---|---|
| `compiler` (Python 3.10 and 3.12) | `./wiki ci --only compiler` | `ruff` (pinned; also lints the CLI), `pytest` with a coverage floor, the offline eval regression gate (doc 14, doc 44) | 15 min |
| `backend` | `./wiki ci --only backend` | eslint, `tsc`, vitest with a coverage floor (units, route integration tests, search benchmark floor), build | 15 min |
| `frontend` | `./wiki ci --only frontend` | eslint, `tsc` (server, client bundles, tests) with i18n key parity, vitest with a coverage floor, build | 15 min |
| `e2e` | `./wiki e2e` | Starts the real backend and frontend and runs Playwright in Chromium (`frontend/test/e2e`) against the sample corpus. Every page must load without a script error or CSP violation. Also checks search deep links, page history, backups and the dashboard. On failure the HTML report is uploaded. | 20 min |
| `docker` | `./wiki docker` | Validates the production compose file (with and without the Caddy profile) and the Caddyfile, and builds the images | 30 min |

- **One run per commit.** Pushes to every branch run the workflow, so a
  branch is checked before a PR exists. For a PR from a branch in this
  repository, the `pull_request` run would repeat the push run on the same
  commit, so every job skips it; the push run's checks appear on the PR.
  PRs from forks have no push run here and run on `pull_request`.
- **No silent skips.** On CI, a step whose prerequisite is missing fails
  instead of being skipped.
- **Timeouts.** A hung server or browser fails the job instead of holding a
  runner for GitHub's 6-hour default.
- Each job writes a results table to the run's summary page.

Run the same checks locally:

```bash
./wiki ci --parallel            # compiler + backend + frontend, as CI does
E2E_PASSWORD=<your admin password> ./wiki e2e   # reuses running servers if present
./wiki docker                   # needs Docker
```

## Dependency audit and updates

`./wiki audit` runs `npm audit --omit=dev` for the backend and frontend
and `pip-audit -r requirements.txt` for the compiler (locally the Python
step is skipped until `pip install pip-audit`). The **Dependency audit**
workflow runs it weekly and whenever a lockfile changes on `main`. It is
not part of Checks on purpose: a newly published advisory would otherwise
turn an unrelated commit red.

Dependabot opens update PRs every Monday, one grouped PR for minor and
patch updates per ecosystem and one PR per major update, and security
updates as soon as an advisory appears. Those PRs run Checks like any
other.

## Deployment

Production runs the Docker stack in `docker-compose.prod.yml` on one
server; setup, TLS and backups are in
[40-production-deployment.md](./40-production-deployment.md). A deploy is
`./deploy/deploy.sh --pull` on the server: `git pull --ff-only`, build the
images, restart.

**Continuous deployment** (`deploy.yml`) does exactly that over SSH after
Checks passes on `main`:

1. It deploys only the commit Checks tested. If `main` has moved on in
   the meantime, it skips; the newer commit's own run deploys it.
2. On the server it runs `deploy/deploy.sh --pull` (plus `DEPLOY_FLAGS`,
   e.g. `--caddy`).
3. It waits up to 5 minutes for `DEPLOY_URL/healthz` to answer.

It stays off, with a notice and a green run, until these repository
secrets exist: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`,
`DEPLOY_KNOWN_HOSTS` (from `ssh-keyscan -t ed25519 <host>`; the host key is
always verified) and `DEPLOY_PATH` (the checkout on the server). Optional
variables: `DEPLOY_PORT`, `DEPLOY_FLAGS`, `DEPLOY_URL`. The job runs in the
`production` environment, where you can require a reviewer's approval.

**Data lives in the checkout.** The compose file bind-mounts `data/` and
`wiki-app/docs/` from the repository directory. `git pull --ff-only`
refuses to overwrite tracked files that were changed on the server, so a
server with local edits fails the deploy rather than losing them. It does
apply the repository's own changes to tracked files: a commit that
replaces the sample corpus (`data/raw/`) or the seed pages
(`wiki-app/docs/`) replaces them on the server too, unless those files
were changed there. Files you add yourself (untracked) are never touched.

## Next

- [40-production-deployment.md](./40-production-deployment.md)
- [46-cli-and-testing.md](./46-cli-and-testing.md)
- [13-configuration.md](./13-configuration.md)

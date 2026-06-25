# 15 — CI/CD and Deployment

## GitHub Actions

**Workflow:** `.github/workflows/wiki-build.yml`  
**Trigger:** push to `main`

### Build job

1. Checkout
2. Python 3.12 — `pip install -r compiler/requirements.txt`
3. `python compiler/main.py` (incremental; heuristic if no secret)
4. Node 20 — `npm ci` in `wiki-app/`
5. `npm run build` with:
   - `GITHUB_PAGES=true`
   - `GITHUB_ORG` = repository owner
   - `GITHUB_REPO` = repository name
6. Upload `wiki-app/build` as Pages artifact

### Deploy job

- `actions/deploy-pages@v4`
- Environment: `github-pages`
- Concurrency group: `pages` (no cancel-in-progress)

### Enable GitHub Pages

Repository Settings → Pages → Source: **GitHub Actions**

Site URL pattern: `https://<org>.github.io/<repo>/`

### LLM in CI

Add repository secret `OPENAI_API_KEY` to run LLM mode in CI. Without it, heuristic mode runs (no API cost).

**Note:** API server and dashboards are **not** deployed — static site only.

## Local production build

```bash
./build_wiki.sh
./build_wiki.sh --force --heuristic-only
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

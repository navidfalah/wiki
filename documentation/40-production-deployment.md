# 40 — Production Deployment (wissensbau.de)

Wissensbau is a **non-commercial research project**. This guide describes how
the prototype is hosted at **https://wissensbau.de** on a deliberately small,
cheap server — and how the stack is tuned so that it stays small.

| | |
|---|---|
| Production stack | `docker-compose.prod.yml` |
| Reverse proxy / TLS | `deploy/Caddyfile` (Caddy 2, automatic Let's Encrypt) |
| Deploy / update script | `deploy/deploy.sh` |
| Images | `backend/Dockerfile`, `frontend/Dockerfile` (multi-stage) |
| Dev stack (unchanged workflow) | `docker-compose.yml` |

## Architecture

```
Internet ──443──► Caddy ──► frontend (Express+EJS, :3000) ──► backend (Express+TS, :8000) ──► python3 cli.py / main.py
                 (TLS,        └─ /api/* proxied with the         └─ data/, wiki-app/docs (bind mounts)
                  gzip)          session cookie → Bearer token
```

Only Caddy publishes ports (80/443). Frontend and backend are reachable solely
on the internal Docker network.

## Server sizing

| Resource | Minimum | Comfortable |
|---|---|---|
| RAM | 1 GB (+ 1–2 GB swap for image builds) | 2 GB |
| vCPU | 1 | 2 |
| Disk | 10 GB | 20 GB (raw data, LLM cache, images) |

Measured idle footprint of the whole stack: **~65 MB** (Caddy 18 MB, frontend
27 MB, backend 20 MB). A chat request or a compile temporarily adds a Python
process (~100–250 MB).

### What keeps it small

- **Multi-stage images** without compilers, pip, devDependencies or TypeScript
  sources; frontend on Alpine. Backend image ≈ 640 MB on disk (was ≈ 860 MB),
  frontend ≈ 250 MB (was ≈ 475 MB).
- **FastAPI/uvicorn dropped from the runtime image** — only the legacy
  `compiler/server.py` used them (`compiler/requirements-server.txt`).
- **Hard memory caps** per container (`*_MEM_LIMIT`) and capped Node heaps
  (`*_HEAP_MB`), so a leak or spike is killed and restarted by Docker instead of
  swapping the host to death.
- **Python concurrency limit** (`PY_MAX_CONCURRENCY`, default 2): chat, email and
  connector calls each spawn an interpreter; excess requests queue instead of
  running in parallel.
- **No boot-time Python spawn** and no sample Postgres (`SKIP_DEFAULT_CONNECTIONS`).
- **Precompiled bytecode** so each spawned interpreter starts fast.
- **Asset caching:** CSS/JS are served with a content-versioned URL and a 1-year
  immutable cache; Caddy compresses text responses (zstd/gzip) but never SSE.
- **Self-hosted fonts** (Sora, Inter) — no third-party requests, GDPR-friendly.
- **Log rotation** (3 × 10 MB per container).

## First deployment

1. **DNS.** Point `A` (and `AAAA`) records for `wissensbau.de` and
   `www.wissensbau.de` at the server. Caddy needs ports **80 and 443** open to
   obtain the certificate.
2. **Server prerequisites:** Docker Engine + the Compose plugin, git.
   On a 1 GB machine add swap before building:
   ```bash
   sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   ```
3. **Get the code and configure:**
   ```bash
   git clone <repo-url> wiki && cd wiki
   cp .env.example .env
   # edit .env: DOMAIN, ADMIN_USERNAME, ADMIN_PASSWORD, OPENAI_API_KEY (or local LLM)
   ```
4. **Start:**
   ```bash
   ./deploy/deploy.sh
   ```
   The script checks `.env`, fixes ownership of `data/` and `wiki-app/` for the
   unprivileged container user (uid 1000), builds, and starts the stack.

`ADMIN_PASSWORD` is **mandatory** in production (compose refuses to start
without it). The bootstrap admin is only created when `data/users.json` has no
users yet; afterwards manage accounts in the **Admin panel** (`/users`).

## Updating

```bash
./deploy/deploy.sh --pull
```

Data in `data/` is never touched. Rollback = `git checkout <previous>` and re-run.

## Configuration reference

All values go in `.env` (see `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `DOMAIN` | `wissensbau.de` | Site address for Caddy, cookies, canonical URLs |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / *(required)* | Bootstrap admin (first boot only) |
| `LEGAL_IMPRINT_URL` / `LEGAL_PRIVACY_URL` | *(empty)* | Footer links (Impressum / Datenschutz) — shown when set |
| `BACKEND_MEM_LIMIT` | `768m` | Backend container cap |
| `FRONTEND_MEM_LIMIT` | `160m` | Frontend container cap |
| `CADDY_MEM_LIMIT` | `64m` | Caddy container cap |
| `BACKEND_HEAP_MB` / `FRONTEND_HEAP_MB` | `160` / `96` | Node heap ceilings |
| `PY_MAX_CONCURRENCY` | `2` | Parallel Python processes (chat/email/connectors) |
| `HTTP_PORT` / `HTTPS_PORT` | `80` / `443` | Host ports (change for a local dry run) |

Lower `PY_MAX_CONCURRENCY` to `1` and `BACKEND_MEM_LIMIT` to `512m` on a 1 GB
host; raise both on a bigger one.

### Local dry run

```bash
DOMAIN=localhost HTTP_PORT=8088 HTTPS_PORT=8443 ADMIN_PASSWORD=test-pass-1 \
  docker compose -f docker-compose.prod.yml up -d --build
# https://localhost:8443  (Caddy's local CA — accept the certificate warning)
```

## Security notes

- Session cookie is `HttpOnly; Secure; SameSite=Lax` (`COOKIE_SECURE=true`).
- Login is throttled: 10 failed attempts per IP / 30 per username per 15 minutes
  (`backend/src/lib/loginThrottle.ts`), keyed on the real client IP that the
  frontend forwards.
- The sign-in page never shows the default credentials in production
  (`SHOW_DEFAULT_LOGIN_HINT=false`).
- Deleting a user, changing their role, or resetting their password revokes
  their sessions immediately.
- Caddy adds HSTS, `nosniff`, `X-Frame-Options: SAMEORIGIN`, a referrer policy,
  and strips the `Server` header.
- The backend port is not published; the API is only reachable through the
  authenticated frontend proxy.
- Legal: German sites generally need an Impressum and a privacy notice, also for
  research projects. Host those pages wherever appropriate and link them with
  `LEGAL_IMPRINT_URL` / `LEGAL_PRIVACY_URL`.

## Backups

State lives in `./data` (users, sessions, chat history, pipeline runs, LLM
cache, raw sources) and `./wiki-app/docs` (compiled pages). Back up both, e.g.
`tar czf backup-$(date +%F).tgz data wiki-app/docs`. The Caddy volume
(`caddy-data`) holds the TLS certificates; losing it only means re-issuing.

## Troubleshooting

| Symptom | Check |
|---|---|
| Compose refuses to start | `ADMIN_PASSWORD` missing in `.env` |
| No certificate / browser TLS error | DNS points at the server? Ports 80/443 open? `docker compose -f docker-compose.prod.yml logs caddy` |
| `EACCES` writing `data/` | `sudo chown -R 1000:1000 data wiki-app/docs wiki-app/static/media` |
| Backend restarts repeatedly | Likely hit its memory cap — lower `PY_MAX_CONCURRENCY` or raise `BACKEND_MEM_LIMIT`; see `docker stats` |
| Build killed on the server | Add swap (see above) or build locally and `docker save … \| ssh … docker load` |
| Login says "Too many failed sign-in attempts" | Wait 15 min, or restart the backend to reset the in-memory counters |

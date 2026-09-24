# 40 — Production Deployment (wissensbau.de)

Wissensbau is a **non-commercial research project**. This guide describes how
the prototype is hosted at **https://wissensbau.de** on a deliberately small,
cheap server — and how the stack is tuned so that it stays small.

The public domain and HTTPS are handled by **Cloudflare** in front of the
server, not by this stack — the app itself just serves plain HTTP on one port.
An optional built-in Caddy profile exists for anyone who isn't using
Cloudflare (see [Alternative: built-in HTTPS with Caddy](#alternative-built-in-https-with-caddy-no-cloudflare) below).

| | |
|---|---|
| Production stack | `docker-compose.prod.yml` |
| Public port | `FRONTEND_PORT` (default **3005**) |
| Domain / TLS | Cloudflare (Tunnel or proxied DNS) |
| Deploy / update script | `deploy/deploy.sh` |
| Images | `backend/Dockerfile`, `frontend/Dockerfile` (multi-stage) |
| Dev stack (unchanged workflow) | `docker-compose.yml` |

## Architecture

```
Browser ──https──► Cloudflare ──http──► frontend :3005→3000 ──► backend :8000 ──► python3 cli.py / main.py
          (visitor never       (Tunnel: outbound-only,           └─ /api/* proxied with the      └─ data/, wiki-app/docs
           touches the          no open port needed --              session cookie → Bearer token    (bind mounts)
           server directly)     see the Tunnel section below)
```

Cloudflare terminates HTTPS for the browser; the connection from Cloudflare to
this server (Tunnel or plain proxied HTTP) doesn't need to be encrypted itself
— Cloudflare's own edge-to-visitor leg is what the browser sees and checks.
Only the frontend container publishes a port; the backend is reachable solely
on the internal Docker network, same as before.

## Server sizing

| Resource | Minimum | Comfortable |
|---|---|---|
| RAM | 1 GB (+ 1–2 GB swap for image builds) | 2 GB |
| vCPU | 1 | 2 |
| Disk | 10 GB | 20 GB (raw data, LLM cache, images) |

Measured idle footprint: **frontend ~20 MB (160 MB cap), backend ~17 MB (768
MB cap)** — comfortable on 1 GB RAM. A chat request or a compile temporarily
adds a Python process (~100–250 MB).

### What keeps it small

- **Multi-stage images** without compilers, pip, devDependencies or TypeScript
  sources; frontend on Alpine. Backend image ≈ 640 MB on disk, frontend ≈ 250 MB.
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
- **Asset caching:** CSS/JS are served with a content-versioned URL and a
  1-year immutable cache. Cloudflare compresses and caches static responses at
  its own edge, so the origin doesn't have to.
- **Self-hosted fonts** (Sora, Inter) — no third-party requests, GDPR-friendly.
- **Log rotation** (3 × 10 MB per container).

## First deployment

1. **Server prerequisites:** Docker Engine + the Compose plugin, git.
   On a 1 GB machine add swap before building:
   ```bash
   sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   ```
2. **Get the code and configure:**
   ```bash
   git clone <repo-url> wiki && cd wiki
   cp .env.example .env
   # edit .env: DOMAIN, ADMIN_USERNAME, ADMIN_PASSWORD, OPENAI_API_KEY (or local LLM)
   ```
3. **Start:**
   ```bash
   ./deploy/deploy.sh
   ```
   The script checks `.env`, fixes ownership of `data/` and `wiki-app/` for the
   unprivileged container user (uid 1000), builds, and starts the stack. The
   app is now listening on `http://localhost:3005` (or `$FRONTEND_PORT`) —
   nothing is publicly reachable yet until Cloudflare is pointed at it (next).
4. **Point Cloudflare at port 3005** — pick one:

### Option A: Cloudflare Tunnel (recommended)

No port ever needs to be open to the internet — `cloudflared` makes an
outbound-only connection from the server to Cloudflare, which then routes
`wissensbau.de` traffic through that tunnel. This is the more secure option
(the server has no public listening port at all, `3005` included) and works
identically behind NAT/CGNAT.

```bash
# On the server, once you're logged into the Cloudflare dashboard for the domain:
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg -o /usr/share/keyrings/cloudflare-main.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared

cloudflared tunnel login                       # opens a browser auth flow
cloudflared tunnel create wissensbau
cloudflared tunnel route dns wissensbau wissensbau.de
```

Create `/etc/cloudflared/config.yml`:

```yaml
tunnel: wissensbau
credentials-file: /root/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: wissensbau.de
    service: http://localhost:3005
  - service: http_status:404
```

Then run it as a service so it survives reboots:

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

### Option B: Cloudflare-proxied DNS record

Simpler to set up, but the server's port `3005` has to be reachable from
Cloudflare's network (ideally firewalled to [Cloudflare's published IP
ranges](https://www.cloudflare.com/ips/) only, not the whole internet).

1. DNS → add an `A` record for `wissensbau.de` (and `www`) pointing at the
   server's public IP, with the **proxy status set to "Proxied" (orange
   cloud)** — this is what makes Cloudflare terminate TLS instead of the
   visitor connecting to the server directly.
2. SSL/TLS → set the encryption mode to **"Flexible"** (browser↔Cloudflare is
   HTTPS, Cloudflare↔origin is plain HTTP, matching what this container
   speaks) and turn on **"Always Use HTTPS"**.
3. Open port `3005` (or your `FRONTEND_PORT`) in the server's firewall.

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
| `DOMAIN` | `wissensbau.de` | Cookies, canonical URLs, CORS — not TLS (Cloudflare handles that) |
| `FRONTEND_PORT` | `3005` | Host port the app listens on; point Cloudflare Tunnel or the proxied DNS record here |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / *(required)* | Bootstrap admin (first boot only) |
| `LEGAL_IMPRINT_URL` / `LEGAL_PRIVACY_URL` | *(empty)* | Footer links (Impressum / Datenschutz) — shown when set |
| `BACKEND_MEM_LIMIT` | `768m` | Backend container cap |
| `FRONTEND_MEM_LIMIT` | `160m` | Frontend container cap |
| `BACKEND_HEAP_MB` / `FRONTEND_HEAP_MB` | `160` / `96` | Node heap ceilings |
| `PY_MAX_CONCURRENCY` | `2` | Parallel Python processes (chat/email/connectors) |

Lower `PY_MAX_CONCURRENCY` to `1` and `BACKEND_MEM_LIMIT` to `512m` on a 1 GB
host; raise both on a bigger one.

### Local dry run

```bash
DOMAIN=localhost FRONTEND_PORT=3005 ADMIN_PASSWORD=test-pass-1 \
  docker compose -f docker-compose.prod.yml up -d --build
# http://localhost:3005
```

## Alternative: built-in HTTPS with Caddy (no Cloudflare)

Not using Cloudflare at all? An opt-in `caddy` Compose profile gets this stack
its own Let's Encrypt certificate instead, publishing 80/443 directly:

```bash
./deploy/deploy.sh --caddy
# or: docker compose -f docker-compose.prod.yml --profile caddy up -d --build
```

Point DNS `A`/`AAAA` records for `wissensbau.de` and `www.wissensbau.de`
straight at the server, and make sure ports **80 and 443** are open (Caddy
needs them for the ACME challenge and to serve traffic). Extra variables:
`HTTP_PORT`/`HTTPS_PORT` (default `80`/`443`), `CADDY_MEM_LIMIT` (default
`64m`). The frontend's `3005` stays published alongside Caddy unless you bind
it to `127.0.0.1` in `docker-compose.prod.yml`. See `deploy/Caddyfile` for the
proxy config — it adds HSTS, `nosniff`, `X-Frame-Options`, a referrer policy,
gzip/zstd compression, and strips the `Server` header.

## Security notes

- Session cookie is `HttpOnly; Secure; SameSite=Lax` (`COOKIE_SECURE=true`) —
  safe even though the origin only speaks HTTP, since the `Secure` flag is
  about the browser↔Cloudflare leg, which is always HTTPS.
- Login is throttled: 10 failed attempts per IP / 30 per username per 15 minutes
  (`backend/src/lib/loginThrottle.ts`), keyed on the real client IP that the
  frontend forwards (`TRUST_PROXY=1`, trusting Cloudflare's `X-Forwarded-For`
  or, with the Caddy profile, Caddy's).
- The sign-in page never shows the default credentials in production
  (`SHOW_DEFAULT_LOGIN_HINT=false`).
- Deleting a user, changing their role, or resetting their password revokes
  their sessions immediately.
- The app itself sets `X-Content-Type-Options: nosniff`, `X-Frame-Options:
  SAMEORIGIN`, a referrer policy, and HSTS (`frontend/src/index.ts`) — present
  regardless of what's in front (Cloudflare, the optional Caddy profile, or
  neither in local dev).
- The backend port is not published; the API is only reachable through the
  authenticated frontend proxy.
- If using Option B (proxied DNS, not Tunnel), firewall `FRONTEND_PORT` to
  [Cloudflare's IP ranges](https://www.cloudflare.com/ips/) so the origin can't
  be reached by bypassing Cloudflare directly.
- Legal: German sites generally need an Impressum and a privacy notice, also for
  research projects. Host those pages wherever appropriate and link them with
  `LEGAL_IMPRINT_URL` / `LEGAL_PRIVACY_URL`.

## Backups

State lives in `./data` (users, sessions, chat history, pipeline runs, LLM
cache, raw sources) and `./wiki-app/docs` (compiled pages). Back up both, e.g.
`tar czf backup-$(date +%F).tgz data wiki-app/docs`.

## Troubleshooting

| Symptom | Check |
|---|---|
| Compose refuses to start | `ADMIN_PASSWORD` missing in `.env` |
| Domain doesn't resolve / Cloudflare shows an error page | Tunnel: `systemctl status cloudflared`, `cloudflared tunnel info wissensbau`. Proxied DNS: is the record orange-clouded, is `FRONTEND_PORT` open and reachable, is SSL/TLS mode "Flexible"? |
| `EACCES` writing `data/` | `sudo chown -R 1000:1000 data wiki-app/docs wiki-app/static/media` |
| Backend restarts repeatedly | Likely hit its memory cap — lower `PY_MAX_CONCURRENCY` or raise `BACKEND_MEM_LIMIT`; see `docker stats` |
| Build killed on the server | Add swap (see above) or build locally and `docker save … \| ssh … docker load` |
| Login says "Too many failed sign-in attempts" | Wait 15 min, or restart the backend to reset the in-memory counters |

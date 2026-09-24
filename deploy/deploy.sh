#!/usr/bin/env bash
# Deploy / update the production stack on the server.
#   ./deploy/deploy.sh                build + (re)start (default: plain HTTP
#                                      on FRONTEND_PORT, for Cloudflare Tunnel
#                                      or a Cloudflare-proxied DNS record --
#                                      see documentation/40)
#   ./deploy/deploy.sh --pull         git pull first
#   ./deploy/deploy.sh --caddy        also start the built-in Caddy service
#                                      (its own Let's Encrypt HTTPS on 80/443,
#                                      for deployments NOT behind Cloudflare)
# Flags can be combined in any order. Safe to re-run; it never touches data/.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
COMPOSE=(docker compose -f docker-compose.prod.yml)

log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

[[ -f .env ]] || die ".env missing. Copy .env.example to .env and fill it in (see README > Deployment)."
# shellcheck disable=SC1091
set -a; source .env; set +a
[[ -n "${ADMIN_PASSWORD:-}" ]] || die "ADMIN_PASSWORD is not set in .env."
[[ -n "${OPENAI_API_KEY:-}" ]] || log "Warning: OPENAI_API_KEY is empty -- the compiler needs an LLM key (or a local LLM) to build."

use_caddy=false
for arg in "$@"; do
  case "$arg" in
    --pull) log "git pull"; git pull --ff-only ;;
    --caddy) use_caddy=true ;;
    *) die "Unknown flag: $arg (expected --pull and/or --caddy)" ;;
  esac
done
$use_caddy && COMPOSE+=(--profile caddy)

# Containers run as the unprivileged `node` user (uid 1000); the bind-mounted
# folders must be writable by it.
mkdir -p data/raw wiki-app/docs wiki-app/static/media
if [[ "$(stat -c %u data 2>/dev/null || stat -f %u data)" != "1000" ]]; then
  log "Fixing ownership of data/ and wiki-app/ (uid 1000) -- may ask for sudo"
  sudo chown -R 1000:1000 data wiki-app/docs wiki-app/static/media
fi

caddy_note=""
$use_caddy && caddy_note=", with built-in Caddy"
log "Building and starting (domain: ${DOMAIN:-wissensbau.de}${caddy_note})"
"${COMPOSE[@]}" up -d --build --remove-orphans

log "Removing dangling images"
docker image prune -f >/dev/null

"${COMPOSE[@]}" ps
if $use_caddy; then
  log "Done. Caddy is serving https://${DOMAIN:-wissensbau.de} directly (ports ${HTTP_PORT:-80}/${HTTPS_PORT:-443})."
else
  log "Done. App is listening on http://localhost:${FRONTEND_PORT:-3005} -- point Cloudflare Tunnel"
  log "(or a Cloudflare-proxied DNS record) at that port to serve https://${DOMAIN:-wissensbau.de}."
fi

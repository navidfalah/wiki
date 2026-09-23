#!/usr/bin/env bash
# Deploy / update the production stack on the server.
#   ./deploy/deploy.sh            build + (re)start
#   ./deploy/deploy.sh --pull     git pull first
# Safe to re-run; it never touches data/.
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

[[ "${1:-}" == "--pull" ]] && { log "git pull"; git pull --ff-only; }

# Containers run as the unprivileged `node` user (uid 1000); the bind-mounted
# folders must be writable by it.
mkdir -p data/raw wiki-app/docs wiki-app/static/media
if [[ "$(stat -c %u data 2>/dev/null || stat -f %u data)" != "1000" ]]; then
  log "Fixing ownership of data/ and wiki-app/ (uid 1000) -- may ask for sudo"
  sudo chown -R 1000:1000 data wiki-app/docs wiki-app/static/media
fi

log "Building and starting (domain: ${DOMAIN:-wissensbau.de})"
"${COMPOSE[@]}" up -d --build --remove-orphans

log "Removing dangling images"
docker image prune -f >/dev/null

"${COMPOSE[@]}" ps
log "Done. Visit https://${DOMAIN:-wissensbau.de}"

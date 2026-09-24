#!/usr/bin/env bash
# Create / complete .env on the server -- no manual editing.
#   ./deploy/setup-env.sh              create .env (from .env.example) and fill every
#                                       required value; existing non-empty values are kept
#   ./deploy/setup-env.sh --deploy     ...then run ./deploy/deploy.sh
#
# Anything can be supplied up front as an environment variable, e.g.
#   OPENAI_API_KEY=... ADMIN_USERNAME=me@example.org ./deploy/setup-env.sh --deploy
# Otherwise: DOMAIN=wissensbau.de, FRONTEND_PORT=3005, ADMIN_USERNAME=admin, a random
# ADMIN_PASSWORD (printed once at the end) and a random CONNECTOR_SECRET_KEY are used.
# The LLM key is asked for interactively when a terminal is attached; without one it is
# left empty (the site runs, the compiler just can't build until you set it).
# Safe to re-run; the resulting .env is chmod 600 and git-ignored.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

run_deploy=false
for arg in "$@"; do
  case "$arg" in
    --deploy) run_deploy=true ;;
    *) die "Unknown flag: $arg (expected --deploy)" ;;
  esac
done

[[ -f .env.example ]] || die ".env.example not found -- run this from a full checkout."
if ! git check-ignore -q .env 2>/dev/null; then
  die ".env is not git-ignored here; refusing to write secrets into a tracked path."
fi
[[ -f .env ]] || { cp .env.example .env; log "Created .env from .env.example"; }
chmod 600 .env

random_token() { # url-safe, no padding
  if command -v openssl >/dev/null 2>&1; then openssl rand -base64 48 | tr '+/' '-_' | tr -d '=\n' | cut -c1-24
  else head -c 64 /dev/urandom | base64 | tr '+/' '-_' | tr -d '=\n' | cut -c1-24; fi
}
fernet_key() { # 32 random bytes, url-safe base64 (what cryptography's Fernet expects)
  if command -v openssl >/dev/null 2>&1; then openssl rand -base64 32 | tr '+/' '-_' | tr -d '\n'
  else head -c 32 /dev/urandom | base64 | tr '+/' '-_' | tr -d '\n'; fi
}

# env_var KEY DEFAULT: an explicitly exported KEY overrides what is already in .env;
# otherwise DEFAULT is only used to fill a missing value.
env_var() {
  local key="$1" default="$2"
  if [[ -n "${!key:-}" ]]; then set_var "$key" "${!key}" 1; else set_var "$key" "$default"; fi
}

current() { grep -E "^$1=" .env | tail -n1 | cut -d= -f2- || true; }

# set_var KEY VALUE [force]: fill KEY only if it has no value yet (or force=1).
# Uses an active `KEY=` line if there is one, else appends. Values are written
# verbatim, so keep them free of newlines.
set_var() {
  local key="$1" value="$2" force="${3:-0}" existing tmp
  existing="$(current "$key")"
  if [[ -n "$existing" && "$force" != 1 ]]; then return 0; fi
  if grep -qE "^$key=" .env; then
    tmp="$(mktemp)"
    KEY="$key" VALUE="$value" awk 'BEGIN{k=ENVIRON["KEY"]; v=ENVIRON["VALUE"]} index($0,k"=")==1{print k"="v; next} {print}' .env >"$tmp"
    cat "$tmp" >.env; rm -f "$tmp"
  else
    printf '%s=%s\n' "$key" "$value" >>.env
  fi
}

generated_password=""

# --- Site ---
env_var DOMAIN wissensbau.de
env_var FRONTEND_PORT 3005

# --- Admin account (created on first boot; see backend/src/lib/users.ts) ---
env_var ADMIN_USERNAME admin
# The bootstrap admin is only created on the FIRST boot; changing this later does
# not change an existing account (use the admin panel for that).
if [[ -n "${ADMIN_PASSWORD:-}" ]]; then
  set_var ADMIN_PASSWORD "$ADMIN_PASSWORD" 1
elif [[ -z "$(current ADMIN_PASSWORD)" ]]; then
  generated_password="$(random_token)"
  set_var ADMIN_PASSWORD "$generated_password"
fi

# --- Encrypts connector credentials at rest ---
# Never regenerated once set: existing connector credentials could no longer be decrypted.
set_var CONNECTOR_SECRET_KEY "$(fernet_key)"

# --- Small-server resource tuning (docker-compose.prod.yml defaults, made explicit) ---
env_var BACKEND_MEM_LIMIT 768m
env_var FRONTEND_MEM_LIMIT 160m
env_var BACKEND_HEAP_MB 160
env_var FRONTEND_HEAP_MB 96
env_var PY_MAX_CONCURRENCY 2

# --- LLM (Gemini by default, see .env.example) ---
[[ -n "${OPENAI_BASE_URL:-}" ]] && set_var OPENAI_BASE_URL "$OPENAI_BASE_URL" 1
[[ -n "${OPENAI_MODEL:-}" ]] && set_var OPENAI_MODEL "$OPENAI_MODEL" 1
if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  set_var OPENAI_API_KEY "$OPENAI_API_KEY" 1
elif [[ -z "$(current OPENAI_API_KEY)" && -t 0 ]]; then
  read -r -s -p "LLM API key (Gemini/OpenAI; Enter to skip): " key; echo
  [[ -n "$key" ]] && set_var OPENAI_API_KEY "$key" 1
fi

chmod 600 .env
log ".env is ready ($(grep -cE '^[A-Z_]+=.+' .env) values set)."
[[ -n "$(current OPENAI_API_KEY)" ]] || log "Note: OPENAI_API_KEY is empty -- add it to .env before running the compiler."
if [[ -n "$generated_password" ]]; then
  printf '\n  Admin login:  %s\n  Password:     %s\n  (shown once -- it is stored in .env)\n\n' "$(current ADMIN_USERNAME)" "$generated_password"
fi

if $run_deploy; then
  exec ./deploy/deploy.sh
fi

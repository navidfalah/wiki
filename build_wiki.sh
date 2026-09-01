#!/usr/bin/env bash
# build_wiki.sh — compile raw data (Python), then build the Express+TS
# backend and frontend for production.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPILER_DIR="${ROOT}/compiler"
BACKEND_DIR="${ROOT}/backend"
FRONTEND_DIR="${ROOT}/frontend"
VENV_DIR="${COMPILER_DIR}/.venv"

log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
err() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; }

# --- Python compiler setup ---
if [[ ! -d "${VENV_DIR}" ]]; then
  log "Creating Python virtualenv in compiler/.venv"
  python3 -m venv "${VENV_DIR}"
fi

# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"

log "Installing Python dependencies"
pip install -q -r "${COMPILER_DIR}/requirements.txt"

# --- Run compiler pipeline ---
log "Running Python compiler (compiler/main.py)"
if ! python "${COMPILER_DIR}/main.py" "$@"; then
  err "Compiler pipeline failed — aborting build"
  exit 1
fi

# --- Backend build ---
if [[ ! -d "${BACKEND_DIR}/node_modules" ]]; then
  log "Installing npm dependencies in backend/"
  (cd "${BACKEND_DIR}" && npm install)
fi
log "Building backend (backend/dist/)"
(cd "${BACKEND_DIR}" && npm run build)

# --- Frontend build ---
if [[ ! -d "${FRONTEND_DIR}/node_modules" ]]; then
  log "Installing npm dependencies in frontend/"
  (cd "${FRONTEND_DIR}" && npm install)
fi
log "Building frontend (frontend/dist/ + frontend/dist-static/)"
(cd "${FRONTEND_DIR}" && npm run build)

log "Done."
log "Run: (cd backend && npm start) in one terminal, (cd frontend && npm start) in another."
log "Or: docker compose up --build"

#!/usr/bin/env bash
# build_wiki.sh — compile raw data into Markdown, then build the Docusaurus static site.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPILER_DIR="${ROOT}/compiler"
WIKI_APP_DIR="${ROOT}/wiki-app"
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
  err "Compiler pipeline failed — aborting Docusaurus build"
  exit 1
fi

# --- Docusaurus static build ---
if [[ ! -d "${WIKI_APP_DIR}/node_modules" ]]; then
  log "Installing npm dependencies in wiki-app/"
  (cd "${WIKI_APP_DIR}" && npm install)
fi

log "Building Docusaurus static site (wiki-app/)"
cd "${WIKI_APP_DIR}"
npm run build

log "Done — static site output in wiki-app/build/"
log "Preview locally: cd wiki-app && npm run serve"

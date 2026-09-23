# syntax=docker/dockerfile:1
#
# Build context is the REPO ROOT (see docker-compose*.yml's `context: .`):
# this image needs both backend/ (the Express+TS API) and compiler/ (the
# Python pipeline, run as a subprocess -- see backend/src/lib/pythonBridge.ts
# and compiler/cli.py). paths.ts resolves PROJECT_ROOT the same way
# compiler/models.py does, so the layout below mirrors the repo: backend/
# and compiler/ as siblings of data/ and wiki-app/.
#
# Three stages so the final image carries no compilers, no pip, no
# devDependencies and no TypeScript sources -- only what runs.

# --- 1. TypeScript build -----------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ .
RUN npm run build && npm prune --omit=dev

# --- 2. Python virtualenv ----------------------------------------------------
FROM node:22-slim AS pydeps
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*
COPY compiler/requirements.txt /tmp/requirements.txt
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -r /tmp/requirements.txt

# --- 3. Runtime --------------------------------------------------------------
FROM node:22-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHON_BIN=/opt/venv/bin/python

WORKDIR /app
COPY --from=pydeps /opt/venv /opt/venv
COPY compiler/ compiler/
# Pre-compile the pipeline's bytecode once: every chat/email request spawns a
# fresh interpreter, and with PYTHONDONTWRITEBYTECODE it would otherwise
# re-parse every module on every start.
RUN /opt/venv/bin/python -m compileall -q compiler
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/node_modules backend/node_modules
COPY backend/package.json backend/

# Mutable state lives in volumes (data/, wiki-app/docs, media); create the
# mount points owned by the unprivileged `node` user so a fresh named volume
# inherits writable ownership.
RUN mkdir -p data/raw wiki-app/docs wiki-app/static/media compiler/temp_output \
    && chown -R node:node data wiki-app compiler/temp_output compiler

USER node
WORKDIR /app/backend
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:8000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]

# Build context is the REPO ROOT (see docker-compose.yml's `context: .`),
# not backend/ -- this image needs both backend/ (the Express+TS API) and
# compiler/ (the Python pipeline + rag_engine.py/email_engine.py, which
# stay Python and are invoked as a subprocess -- see
# backend/src/lib/pythonBridge.ts and compiler/cli.py). paths.ts resolves
# PROJECT_ROOT the same way compiler/models.py does, so the layout below
# has to mirror the repo: backend/ and compiler/ as siblings of data/ and
# wiki-app/.
#
# Multi-stage: devDependencies (typescript, tsx, eslint, vitest, ...) are
# only needed to produce backend/dist/, not to run it -- the runtime stage
# below installs production deps only and copies in the compiled output.
FROM node:20-slim AS build

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci
COPY backend/ .
RUN npm run build

FROM node:20-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY compiler/requirements.txt compiler/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r compiler/requirements.txt
COPY compiler/ compiler/

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/backend/dist ./dist

WORKDIR /app
RUN mkdir -p data/raw wiki-app/docs wiki-app/static/media

# Run as the non-root `node` user node:20-slim already ships (uid/gid
# 1000) instead of root. This only affects paths owned by the image
# itself -- docker-compose.yml bind-mounts data/, wiki-app/docs/,
# wiki-app/static/media/, compiler/temp_output/, and compiler/ from the
# host, and a bind mount keeps the HOST's ownership, not the image's. On
# the very common case of a Linux host whose invoking user is uid 1000
# (the default first non-root user on virtually every distro) this needs
# no extra step; otherwise run e.g. `chown -R 1000:1000 data wiki-app/docs
# wiki-app/static/media compiler/temp_output` on the host once before
# `docker compose up`, or override the container's user to match your
# host uid with `docker compose run --user "$(id -u):$(id -g)"`.
RUN chown -R node:node /app
USER node

ENV PYTHONUNBUFFERED=1
ENV PYTHON_BIN=python3
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8000/api/health || exit 1

CMD ["node", "dist/index.js"]

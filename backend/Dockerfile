# syntax=docker/dockerfile:1
#
# Build context is the REPO ROOT (see docker-compose*.yml's `context: .`):
# The backend runs the compiler and connectors in JavaScript. The extension
# manifest remains at its existing path for compatibility with local data.
#
# Two stages so the final image carries no language compilers, no pip, no
# devDependencies and no TypeScript sources -- only what runs.

# --- 1. TypeScript build -----------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ .
RUN npm run build && npm prune --omit=dev

# --- 2. Runtime --------------------------------------------------------------
FROM node:22-slim
ENV NODE_ENV=production

WORKDIR /app
COPY compiler/all_source_extensions.json compiler/all_source_extensions.json
COPY compiler/main.js compiler/main.js
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/node_modules backend/node_modules
COPY backend/package.json backend/

# Mutable state lives in volumes (data/, wiki-app/docs, media); create the
# mount points owned by the unprivileged `node` user so a fresh named volume
# inherits writable ownership. That only covers ownership *inside the image*
# though -- these paths are bind-mounted from the host in docker-compose.yml/
# docker-compose.prod.yml, and a bind mount keeps the HOST's ownership, not
# the image's. deploy/deploy.sh handles this automatically (chown to uid
# 1000 -- the `node` user's uid, and the default first non-root user on
# virtually every Linux distro); if you're not using it, either run that
# chown yourself once before `docker compose up`, or override the
# container's user to match your host uid with `docker compose run --user
# "$(id -u):$(id -g)"`.
RUN mkdir -p data/raw wiki-app/docs wiki-app/static/media compiler/temp_output \
    && chown -R node:node data wiki-app compiler/temp_output compiler

USER node
WORKDIR /app/backend
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:8000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]

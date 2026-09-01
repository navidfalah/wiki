# Build context is the REPO ROOT (see docker-compose.yml's `context: .`),
# not backend/ -- this image needs both backend/ (the Express+TS API) and
# compiler/ (the Python pipeline + rag_engine.py/email_engine.py, which
# stay Python and are invoked as a subprocess -- see
# backend/src/lib/pythonBridge.ts and compiler/cli.py). paths.ts resolves
# PROJECT_ROOT the same way compiler/models.py does, so the layout below
# has to mirror the repo: backend/ and compiler/ as siblings of data/ and
# wiki-app/.
FROM node:20-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY compiler/requirements.txt compiler/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r compiler/requirements.txt
COPY compiler/ compiler/

COPY backend/package.json backend/package-lock.json* backend/
WORKDIR /app/backend
RUN npm install
COPY backend/ .
RUN npm run build

WORKDIR /app
RUN mkdir -p data/raw wiki-app/docs wiki-app/static/media

WORKDIR /app/backend
ENV PYTHONUNBUFFERED=1
ENV PYTHON_BIN=python3
EXPOSE 8000

CMD ["node", "dist/index.js"]

# Build context is the REPO ROOT, not compiler/ — see docker-compose.yml's
# `context: .` for this service. That's not a stylistic choice: models.py
# resolves PROJECT_ROOT as compiler/'s *parent* directory
# (`Path(__file__).resolve().parent.parent`) and derives data/,
# wiki-app/docs/, and wiki-app/static/media/ from it, so the container's
# filesystem layout has to mirror the repo's — compiler/ as a sibling of
# data/ and wiki-app/, not standing alone — for those paths to resolve to
# anything at all.
FROM python:3.12-slim

WORKDIR /app

COPY compiler/requirements.txt compiler/requirements.txt
RUN pip install --no-cache-dir -r compiler/requirements.txt

COPY compiler/ compiler/

# Placeholders so RAW_DIR/OUTPUT_DIR/STATIC_MEDIA_DIR exist even if this
# image is run without docker-compose's volume mounts (a fresh clone with
# no raw data yet, e.g. `docker run` standalone) — server.py's endpoints
# handle an empty data/raw/ gracefully, but a *missing* directory isn't
# the same thing.
RUN mkdir -p data/raw wiki-app/docs wiki-app/static/media

WORKDIR /app/compiler
ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# Matches run_server.sh's own entrypoint (python server.py), which also
# gives the uvicorn.run(..., reload=True) path in server.py's __main__
# block — useful with docker-compose's live-mounted ./compiler volume.
CMD ["python", "server.py"]

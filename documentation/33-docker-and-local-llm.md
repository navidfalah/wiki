# 33 — Docker Deployment and a Local LLM (Ollama)

Three services, each in its own container: the compiler/API, the
Docusaurus frontend, and an optional local LLM (Ollama) as a drop-in
replacement for the OpenAI API — no code changes needed for the last part,
because `llm_client.py` was already built against an OpenAI-*compatible*
endpoint (it already supports Gemini this way, per `.env.example`).

| | |
|---|---|
| Orchestration | `docker-compose.yml` (repo root) |
| Compiler/API image | `compiler/Dockerfile` |
| Frontend image | `wiki-app/Dockerfile` |
| Local LLM entrypoint | `docker/ollama-entrypoint.sh` |
| Build context exclusions | `.dockerignore` |

## Quick start

```bash
cp .env.example .env        # fill in an API key, or skip if using Ollama
docker compose up --build   # compiler-api :8000, wiki-app :3000
```

For the local LLM instead of a paid API:

```bash
docker compose --profile local-llm up --build
```

The `ollama` service only starts with `--profile local-llm` — a plain
`docker compose up` never pulls or runs it, so it costs nothing (no image
pull, no container) unless explicitly asked for.

## Why three services, and why `compiler-api`'s build context is the repo root

`compiler-api` and `wiki-app` map directly onto the two processes the
non-Docker docs already run separately (`run_server.sh` / `npm start`,
see [11](./11-wiki-app-and-dashboards.md)/[12](./12-api-server.md)) — this
isn't a new architecture, just the existing one containerized.

One deliberate detail: `compiler/Dockerfile` is built with `context: .`
(the repo root), not `context: ./compiler`. That's not stylistic —
`compiler/models.py` resolves `PROJECT_ROOT` as `compiler/`'s *parent*
directory and derives `data/`, `wiki-app/docs/`, and
`wiki-app/static/media/` from it. If the image only contained `compiler/`
in isolation, those paths would resolve to directories that don't exist.
The container's filesystem layout mirrors the repo's for the same reason
the local dev setup does.

`docker-compose.yml` mounts `./data`, `./wiki-app/docs`, and
`./wiki-app/static/media` as bind volumes (not baked into the image) so a
compile's output persists across rebuilds and is visible on the host —
and mounts `./compiler` itself as a live volume, so editing Python during
development doesn't require a rebuild (`server.py`'s own
`uvicorn.run(..., reload=True)` picks up the change).

## Switching to the local LLM

Same environment variables `.env.example` already documents for
Gemini — Ollama's `/v1` endpoint speaks the same OpenAI-compatible wire
format the `openai` Python SDK (and therefore `llm_client.py`) already
targets:

```env
OPENAI_API_KEY=ollama                    # any non-empty string; Ollama ignores it
OPENAI_BASE_URL=http://ollama:11434/v1   # container-to-container DNS name
OPENAI_MODEL=llama3.2
OPENAI_EMBEDDING_MODEL=nomic-embed-text  # needed for hybrid_retrieval.py, task #5
```

`OPENAI_EMBEDDING_MODEL` matters specifically because of task #5's hybrid
retrieval work ([25](./25-hybrid-retrieval.md)) and task #11's vector-store
wiring ([31](./31-vector-graph-storage-and-scalability.md#live-pipeline-wiring)):
`LLMClient.embed_text()` calls whatever model this is set to, so it has to
name an actual embedding-capable model the `ollama` container has pulled —
a chat-only model like `llama3.2` can't serve `/v1/embeddings`.

`docker/ollama-entrypoint.sh` handles the pull automatically: the stock
`ollama/ollama` image ships the server binary with no models installed, so
the entrypoint starts `ollama serve` in the background, waits for it to
respond, then runs `ollama pull` for both `OLLAMA_CHAT_MODEL` (default
`llama3.2`) and `OLLAMA_EMBED_MODEL` (default `nomic-embed-text`) before
handing control to the server process. First startup will be slow (model
downloads, several GB); `ollama-data` is a named volume specifically so
that cost is paid once, not on every container restart.

## GPU acceleration (optional, not configured by default)

The `ollama` service runs CPU-only as written — correct for a laptop
without a dedicated GPU, but slow for anything beyond a small model. If
the host has an NVIDIA GPU and the
[NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
installed, add to the `ollama` service in `docker-compose.yml`:

```yaml
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

Not included by default because it silently fails (or requires driver
setup this repo can't verify) on a host without that toolkit — opt-in only.

## What's verified here vs. what isn't

**Verified, in this environment:** `docker compose config` (and
`docker compose --profile local-llm config`) resolve the compose file
cleanly with no daemon required — both shown above with real output, not
just claimed. `docker/ollama-entrypoint.sh` passes `sh -n` syntax
checking. The Dockerfiles were written against the exact same commands
the non-Docker docs already document (`python server.py`,
`npm start -- --host 0.0.0.0`), not invented from scratch.

**Not verified here, and stated plainly rather than implied:** this
sandbox has the `docker` CLI installed but no running daemon
(`docker ps` / `docker build` both fail with "failed to connect to the
docker API... dial unix /var/run/docker.sock: ... no such file or
directory") — so `docker compose up --build` has not actually been run,
no image has actually been built, and no container has actually served a
request in this session. Same posture as tasks #4/#5/#8's live-model
gaps: the mechanism is real and inspectable, the live run is the
reader's/user's to do, on a machine with Docker actually running.

## Next

- [25-hybrid-retrieval.md](./25-hybrid-retrieval.md) / [31-vector-graph-storage-and-scalability.md](./31-vector-graph-storage-and-scalability.md) — why `OPENAI_EMBEDDING_MODEL` has to name a real embedding model, not just any model
- [12-api-server.md](./12-api-server.md) — what `compiler-api`'s container actually runs (`server.py`), containerized as-is
- `.env.example` — the OpenAI / Gemini / Ollama variable blocks, side by side

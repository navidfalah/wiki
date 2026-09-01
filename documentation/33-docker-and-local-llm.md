# 33 — Docker Deployment and a Self-Contained Local LLM (Gemma)

Three services, each in its own container: the Express+TS **backend**
(which also carries the Python compiler and shells out to it — see
[11](./11-wiki-app-and-dashboards.md)), the Express+TS+Tailwind
**frontend**, and an optional local LLM as a drop-in replacement for the
OpenAI API — no code changes needed for the last part, because
`llm_client.py` was already built against an OpenAI-*compatible* endpoint
(it already supports Gemini this way, per `.env.example`).

The local LLM runs **in its own container, with no separate model-
management daemon** — no Ollama. `docker/local-llm/` builds
`llama-cpp-python`'s own OpenAI-compatible server directly, loading a GGUF
build of Gemma at container startup.

| | |
|---|---|
| Orchestration | `docker-compose.yml` (repo root) |
| Backend image (Node + Python) | `backend/Dockerfile` |
| Frontend image (Node only) | `frontend/Dockerfile` |
| Local LLM image + entrypoint | `docker/local-llm/Dockerfile`, `docker/local-llm/entrypoint.sh` |
| Build context exclusions | `.dockerignore` |

## Quick start

```bash
cp .env.example .env        # fill in an API key, or skip if using the local LLM
docker compose up --build   # backend :8000, frontend :3000
```

For the local LLM instead of a paid API:

```bash
docker compose --profile local-llm up --build
```

The `local-llm` service only starts with `--profile local-llm` — a plain
`docker compose up` never builds or runs it, so it costs nothing (no
multi-GB model download, no container) unless explicitly asked for.

## Why three services, and why `backend`'s build context is the repo root

`backend` and `frontend` map directly onto the two processes the
non-Docker docs already run separately (`npm run dev:server` in each, see
[11](./11-wiki-app-and-dashboards.md)/[12](./12-api-server.md)) — this
isn't a new architecture, just the existing one containerized.

One deliberate detail: `backend/Dockerfile` is built with `context: .`
(the repo root), not `context: ./backend`. That's not stylistic — the
image needs *both* `backend/` (Node) and `compiler/` (Python), since the
backend spawns `python3 main.py`/`cli.py` as subprocesses rather than
calling a separate service (see
[11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md)'s
"Python bridge" section) — so `backend/Dockerfile` installs Python
alongside Node in the same image and copies `compiler/` in too.
`compiler/models.py` resolves `PROJECT_ROOT` as `compiler/`'s *parent*
directory and derives `data/`, `wiki-app/docs/`, and
`wiki-app/static/media/` from it, so the container's filesystem layout
mirrors the repo's for the same reason the local dev setup does.
`frontend/Dockerfile`, by contrast, is self-contained (`context:
./frontend`) — the frontend never touches `compiler/` or `data/`
directly, only the backend's REST API.

`docker-compose.yml` mounts `./data`, `./wiki-app/docs`, and
`./wiki-app/static/media` as bind volumes on the `backend` service (not
baked into the image) so a compile's output persists across rebuilds and
is visible on the host — and mounts `./compiler` itself as a live volume,
so editing `main.py`/`cli.py` during development doesn't require a
rebuild (the Node side of `backend/` is not live-mounted; rebuild the
image to pick up TypeScript changes).

## Why not Ollama

Ollama is a fine choice generally, but it's a *second* server process
managing its own model store and its own API surface on top of
llama.cpp — a layer this project doesn't need. `docker/local-llm/`
installs `llama-cpp-python[server]` (llama.cpp's own Python bindings,
which include an OpenAI-compatible FastAPI server) and runs it directly:
one container, one process, one thing to reason about. The tradeoff is
that model management (the download, the volume, the "don't re-download
on every restart" logic) is this project's own responsibility instead of
an external tool's — that's what `docker/local-llm/entrypoint.sh` does.

## How it works

`docker/local-llm/entrypoint.sh` checks whether the configured model file
already exists in the `local-llm-models` named volume; if not, it runs
`huggingface-cli download` to fetch it, then execs
`python -m llama_cpp.server` with that model loaded, serving an
OpenAI-compatible API on port 8080 (`--chat_format gemma` selects
llama.cpp's built-in Gemma chat template). Because the model lives in a
named volume rather than the image, rebuilding the image (e.g. after a
pip dependency bump) doesn't force a multi-GB re-download, and swapping
models is a `.env` change, not a Dockerfile edit:

```env
LOCAL_LLM_MODEL_REPO=<huggingface-org>/<repo>
LOCAL_LLM_MODEL_FILE=<exact-gguf-filename>
LOCAL_LLM_MODEL_ALIAS=gemma-4
```

Then point the compiler at it, same pattern as the Gemini block in
`.env.example`:

```env
OPENAI_API_KEY=local                  # any non-empty string; llama.cpp's server doesn't check it
OPENAI_BASE_URL=http://local-llm:8080/v1
OPENAI_MODEL=gemma-4                  # must match LOCAL_LLM_MODEL_ALIAS
```

**Embeddings are not served by this container.** `llama-cpp-python`'s
server can technically produce embeddings from a causal LM, but a single
GGUF checkpoint tuned for chat generally isn't a good embedding model, and
the request that shaped this design was specifically about *extraction*
(chat completions), not retrieval. `hybrid_retrieval.py`'s embedding tier
(task #5) and the vector-store wiring (task #11) still need
`OPENAI_EMBEDDING_MODEL` pointed at a real embeddings endpoint (OpenAI or
Gemini) even when `local-llm` is handling chat — `retrieve_hybrid()`
degrades to BM25-only automatically if that call fails, so nothing breaks,
but it's worth knowing this container doesn't cover that tier. A follow-up
that wants fully-local retrieval too would add a small second server (or a
`--embedding true` llama.cpp instance loading an actual embedding model)
rather than reusing this one.

## An important, stated-plainly gap: the exact Gemma model name

`LOCAL_LLM_MODEL_REPO`/`LOCAL_LLM_MODEL_FILE` default to
`google/gemma-4-it-GGUF` / `gemma-4-it-Q4_K_M.gguf` — **this is a
placeholder naming pattern, not a Hugging Face repo this was checked
against.** "Gemma 4" is the name given for this task, but this assistant's
knowledge cutoff predates whatever release that refers to, so the exact
repo owner, file name, and quantization suffix couldn't be verified against
a real Hugging Face listing. Before running `--profile local-llm`:

1. Find the actual GGUF repo for the Gemma build you want (Hugging Face
   search, or the official `google/gemma-*` repos if you're using an
   official quantization — those are gated and need `HF_TOKEN` set to an
   access token that has accepted the license).
2. Set `LOCAL_LLM_MODEL_REPO` and `LOCAL_LLM_MODEL_FILE` in `.env` to match
   exactly (the filename has to be byte-exact — GGUF repos usually offer
   several quantization levels as separate files).
3. `LOCAL_LLM_CHAT_FORMAT=gemma` should work for any Gemma-family
   instruction-tuned model; if llama.cpp's built-in `gemma` template
   doesn't match the specific model's expected format, chat output quality
   will suffer even though the server runs without error — worth a manual
   sanity check against the first extraction it produces.

Getting this wrong fails loudly and early: `huggingface-cli download` in
the entrypoint errors out on a nonexistent repo/file rather than the
container silently starting with the wrong model.

## GPU acceleration (optional, not configured by default)

`docker/local-llm/Dockerfile` builds `llama-cpp-python` CPU-only by
default — correct for a laptop without a dedicated GPU, but slow for
anything beyond a small quantization. For a CUDA build on a host with an
NVIDIA GPU and the
[NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
installed:

1. Build with `CMAKE_ARGS=-DGGML_CUDA=on` (a build arg the Dockerfile
   already accepts): add `args: {CMAKE_ARGS: "-DGGML_CUDA=on"}` under the
   `local-llm` service's `build:` key in `docker-compose.yml`, and switch
   the base image to one with the CUDA toolkit (`nvidia/cuda:...-devel`
   instead of `python:3.12-slim`) so `nvcc` is available at build time.
2. Add to the `local-llm` service:
   ```yaml
       deploy:
         resources:
           reservations:
             devices:
               - driver: nvidia
                 count: all
                 capabilities: [gpu]
   ```

Not included by default because it requires a base-image swap this repo
can't verify builds correctly without a working Docker daemon to test
against (see below) — opt-in only, and worth testing on the target host
before relying on it.

## What's verified here vs. what isn't

**Verified, in this environment:** `docker compose config` (and
`docker compose --profile local-llm config`) resolve the compose file
cleanly with no daemon required. `docker/local-llm/entrypoint.sh` passes
`sh -n` syntax checking. `backend/Dockerfile` and `frontend/Dockerfile`
run the exact same `npm run build && node dist/index.js` sequence the
non-Docker docs document, and that exact sequence was run directly (not
in Docker) in this environment and confirmed working end to end — real
HTTP 200s on `/wiki/*`, `/dashboard`, `/api/health`, `/api/chat/status`,
static CSS/JS assets — before the Dockerfiles were written around it.

**Not verified here, and stated plainly rather than implied:** this
sandbox has the `docker` CLI installed but no running daemon
(`docker ps` / `docker build` both fail with "failed to connect to the
docker API... dial unix /var/run/docker.sock: ... no such file or
directory") — so `docker compose up --build` has not actually been run,
no image has actually been built (the Dockerfiles' `apt-get install
python3`/`npm install`/`pip install` steps have not been exercised
inside a real container), `llama-cpp-python`'s build (which compiles
C++ — the part most likely to hit an environment-specific issue) has not
been exercised, and the placeholder Gemma model name above has not been
confirmed to exist. Same posture as tasks #4/#5/#8's live-model gaps: the
mechanism is real and inspectable, the live run — and confirming the real
model name — is the reader's/user's to do, on a machine with Docker
actually running.

## Next

- [25-hybrid-retrieval.md](./25-hybrid-retrieval.md) / [31-vector-graph-storage-and-scalability.md](./31-vector-graph-storage-and-scalability.md) — why `OPENAI_EMBEDDING_MODEL` still needs a real embeddings endpoint even with `local-llm` handling chat
- [12-api-server.md](./12-api-server.md) — what the `backend` container actually runs
- `.env.example` — the OpenAI / Gemini / local-llm variable blocks, side by side

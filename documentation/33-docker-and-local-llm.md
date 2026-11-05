# 33 — Docker Deployment and Local LLM

The application runs in JavaScript/TypeScript containers. An optional local model profile serves an OpenAI-compatible API with the official llama.cpp server image. A separate Node.js init container downloads the configured GGUF file into a shared Docker volume. No Python runtime is used by this service.

| Component | Implementation |
|---|---|
| Backend | `backend/Dockerfile` |
| Frontend | `frontend/Dockerfile` |
| Local model server | `ghcr.io/ggml-org/llama.cpp:server` |
| Model downloader | `docker/local-llm/download-model.mjs` in `node:22-alpine` |
| Compose configuration | `docker-compose.yml` |

The official llama.cpp image provides the `llama-server` executable and accepts a GGUF file with `-m`, then serves the OpenAI-compatible API. See the [llama.cpp Docker guide](https://github.com/ggml-org/llama.cpp/blob/master/docs/docker.md) and [server options](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md).

## Start the application

```bash
cp .env.example .env
# Set OPENAI_API_KEY and any provider/model overrides.
docker compose up --build
```

The local model service is opt-in:

```bash
docker compose --profile local-llm up --build
```

The `local-llm-model` init service checks for the configured file in the named `local-llm-models` volume. If missing, it downloads the file from Hugging Face, optionally using `HF_TOKEN`, writes to a temporary path and renames it after a successful transfer. The llama.cpp server starts after the init service completes and listens on port 8080.

Configure the model in `.env`:

```env
LOCAL_LLM_MODEL_REPO=bartowski/gemma-2-2b-it-GGUF
LOCAL_LLM_MODEL_FILE=gemma-2-2b-it-Q5_K_M.gguf
LOCAL_LLM_MODEL_ALIAS=gemma-2-2b-it
LOCAL_LLM_CONTEXT=4096
LOCAL_LLM_CHAT_FORMAT=gemma
HF_TOKEN=
```

Point the application at the local endpoint:

```env
OPENAI_API_KEY=local
OPENAI_BASE_URL=http://local-llm:8080/v1
OPENAI_MODEL=gemma-2-2b-it
```

The API key can be any non-empty value for this server. The model alias must match `OPENAI_MODEL`. The GGUF model repository and filename are configurable; gated Hugging Face repositories require a token.

## Scope and limitations

The local profile handles chat completions for compilation and chat. Embeddings and transcription still require their own configured provider endpoints; if embeddings are unavailable, retrieval falls back to BM25. The configured Gemma GGUF must contain a compatible chat template or use a supported `LOCAL_LLM_CHAT_FORMAT` value.

The Compose `docker` workflow validates configuration and builds the production images, but it does not download multi-gigabyte model files or verify a live model response. The local profile should be started separately on a machine with Docker and sufficient memory.

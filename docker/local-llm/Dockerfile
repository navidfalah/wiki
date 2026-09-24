# Self-contained local LLM inference — no Ollama, no separate model-
# management daemon. This image builds llama.cpp's Python bindings
# (llama-cpp-python[server]) and runs its own OpenAI-compatible server
# directly inside this container, loading a GGUF build of Gemma from
# Hugging Face at first startup (see entrypoint.sh).
#
# CPU build by default (works on any host, no GPU driver setup required).
# For a CUDA build on a host with an NVIDIA GPU + the NVIDIA Container
# Toolkit, set CMAKE_ARGS="-DGGML_CUDA=on" as a build arg — see
# documentation/33-docker-and-local-llm.md.
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake git curl \
    && rm -rf /var/lib/apt/lists/*

ARG CMAKE_ARGS=""
ENV CMAKE_ARGS=${CMAKE_ARGS}
RUN pip install --no-cache-dir "llama-cpp-python[server]" "huggingface_hub[cli]"

WORKDIR /models

# The model itself is NOT baked into the image — it's fetched by
# entrypoint.sh on first container start into the /models volume
# docker-compose.yml mounts, so a rebuild of this image (e.g. after an
# apt/pip change) doesn't re-download several GB of weights, and swapping
# MODEL_REPO/MODEL_FILE doesn't require touching this Dockerfile at all.
COPY docker/local-llm/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Unlike backend/Dockerfile's bind mounts, docker-compose.yml mounts /models
# as a NAMED volume (local-llm-models) -- Docker initializes an empty named
# volume from the image's own directory content/ownership on first use, so
# chown-ing it here (before it's ever mounted) propagates correctly instead
# of being shadowed by pre-existing host ownership the way a bind mount
# would be.
RUN useradd -r -m -d /home/llm llm && chown -R llm:llm /models
USER llm

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
    CMD curl -sf http://localhost:8080/v1/models || exit 1

ENTRYPOINT ["/entrypoint.sh"]

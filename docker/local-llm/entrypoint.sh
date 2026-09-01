#!/bin/sh
# Entrypoint for the self-contained local-llm service (docker-compose.yml).
# Downloads the configured GGUF model into /models on first start (skipped
# on later restarts — that's what the local-llm-models named volume is
# for), then runs llama.cpp's own OpenAI-compatible server in this same
# container. No Ollama, no separate model-management process.
set -e

: "${MODEL_REPO:?MODEL_REPO must be set — see documentation/33-docker-and-local-llm.md}"
: "${MODEL_FILE:?MODEL_FILE must be set — see documentation/33-docker-and-local-llm.md}"

MODEL_PATH="/models/${MODEL_FILE}"

if [ ! -f "${MODEL_PATH}" ]; then
  echo "[local-llm] ${MODEL_FILE} not found in the model volume — downloading from ${MODEL_REPO}..."
  # HF_TOKEN is only required for gated repos (the official google/gemma-*
  # weights on Hugging Face require accepting a license and passing a
  # token; many community GGUF re-uploads don't). Left unset here if the
  # caller didn't provide one — `hf download` will fail with a clear
  # "gated repo" error in that case rather than hanging.
  #
  # `huggingface-cli` (and its `--local-dir-use-symlinks` flag) were
  # removed from huggingface_hub's CLI in favor of the `hf` command, which
  # always writes real files into --local-dir (no symlink mode to opt out
  # of anymore).
  hf download "${MODEL_REPO}" "${MODEL_FILE}" \
    --local-dir /models
else
  echo "[local-llm] ${MODEL_FILE} already present in the model volume — skipping download."
fi

echo "[local-llm] starting llama.cpp server: model=${MODEL_FILE} alias=${MODEL_ALIAS:-gemma-4} ctx=${LOCAL_LLM_CONTEXT:-4096}"
exec python -m llama_cpp.server \
  --model "${MODEL_PATH}" \
  --model_alias "${MODEL_ALIAS:-gemma-4}" \
  --host 0.0.0.0 \
  --port 8080 \
  --n_ctx "${LOCAL_LLM_CONTEXT:-4096}" \
  --chat_format "${LOCAL_LLM_CHAT_FORMAT:-gemma}"

#!/bin/sh
# Entrypoint for the optional `ollama` service in docker-compose.yml.
#
# The official ollama/ollama image ships the server binary but no models —
# `ollama pull` needs the server already listening, so this starts
# `ollama serve` in the background, waits for it to answer, pulls the chat
# and embedding models the compiler is configured to use, then waits on the
# server process so the container keeps running with the same PID 1 it
# started with (`docker compose stop` sends SIGTERM to this script's own
# process group, which needs to actually own the server, not have
# backgrounded and exited past it).
set -e

ollama serve &
SERVER_PID=$!

echo "[ollama-entrypoint] waiting for the Ollama server to become ready..."
until ollama list >/dev/null 2>&1; do
  sleep 1
done

CHAT_MODEL="${OLLAMA_CHAT_MODEL:-llama3.2}"
EMBED_MODEL="${OLLAMA_EMBED_MODEL:-nomic-embed-text}"

echo "[ollama-entrypoint] pulling chat model: ${CHAT_MODEL}"
ollama pull "${CHAT_MODEL}"

echo "[ollama-entrypoint] pulling embedding model: ${EMBED_MODEL}"
ollama pull "${EMBED_MODEL}"

echo "[ollama-entrypoint] ready — chat=${CHAT_MODEL} embeddings=${EMBED_MODEL}"
wait "${SERVER_PID}"

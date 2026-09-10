---
id: rag-engine
title: RAG Engine
tags:
  - extactiven-fallback-chat-mode
  - heading-scoped-passage-splitting
  - hybrid-retrieval
  - rag-engine
  - rag-enginepy
  - wiki
last_updated: "2026-09-10T14:40:15.947332+00:00"
sidebar_label: RAG Engine
slug: /rag-engine
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# RAG Engine

## Overview
The Chat / [RAG](./rag.md) engine (`rag_engine.py`) answers questions over the compiled wiki (`wiki-app/docs/`)—utilizing the cross-linked network built by `linker.py`—rather than over raw pipeline chunks. This ensures that every citation points to a specific page that a user can click into. It supports both LLM-generated responses and a zero-config extractive fallback mode.

## Key Details
- **Corpus Building (`build_corpus`)**: Loads every compiled page from `docs_dir=OUTPUT_DIR` and splits it into heading-scoped passages, reusing `text_chunking.split_text_into_chunks` for size-bounding.
- **Retrieval (`retrieve` & `retrieve_hybrid`)**: 
  - `retrieve(query, corpus, top_k=5)` uses standard library BM25 ranking without requiring a vector database or external [API](./api.md).
  - `retrieve_hybrid(..., llm=)` fuses embedding similarity and an LLM reranker when an API key is configured, degrading gracefully tier-by-tier otherwise (see [25-hybrid-retrieval.md](./25-hybrid-retrieval.md)).
- **Answering (`answer_question`)**: Retrieves passages via `retrieve_hybrid()` and handles response generation based on [configuration](./configuration.md) and results:
  - **`mode: "generated"`**: Active when `OPENAI_API_KEY` is configured. Hands retrieved excerpts to the chat model using `CHAT_SYSTEM_PROMPT` to answer strictly from the excerpts and cite them as `[1]`, `[2]`, etc.
  - **`mode: "extractive"`**: Active when an API key is absent or the API call fails. Builds an extractive answer directly from the top retrieved passages, allowing chat to function with zero API setup.
  - **`mode: "empty"`**: Triggered when nothing has been compiled yet.
  - **`mode: "no_match"`**: Triggered when the corpus contains nothing relevant to the query.
- **[API Endpoints](./api-endpoints.md)**:
  - `POST /api/chat` (accepts body `{"message": str, "history": [{"role", "content"}, ...]}`)
  - `GET /api/chat/status` (reports corpus size and whether an LLM is configured)

## Related Entities
- `linker.py`
- `rag_engine.py`
- `wiki-app/docs/`
- [25-hybrid-retrieval.md](./25-hybrid-retrieval.md)

## Related Concepts
- Hybrid retrieval
- BM25 ranking
- Heading-scoped passage splitting
- Extractive fallback chat mode
- LLM reranking

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

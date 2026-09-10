---
id: chat-api
title: Chat API
tags:
  - chat-api
  - extractive-fallback-chat-mode
  - heading-scoped-passage-splitting
  - hybrid-retrieval
  - rag-enginepy
  - wiki
last_updated: "2026-09-10T14:37:36.107836+00:00"
sidebar_label: Chat API
slug: /chat-api
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Chat API

## Overview
The Chat / [RAG engine](./rag-engine.md) (`rag_engine.py`) provides question-answering capabilities over the compiled wiki (`wiki-app/docs/`), utilizing the cross-linked network established by `linker.py`. By operating over compiled pages rather than raw pipeline chunks, every citation points directly to a clickable page. The system is exposed via [API endpoints](./api-endpoints.md) and supports both generative (LLM-backed) and extractive fallback modes to ensure functionality even with zero [API](./api.md) setup.

## Key Details
- **Corpus Building**: `build_corpus(docs_dir=OUTPUT_DIR)` loads every compiled page and splits it into heading-scoped passages, reusing `text_chunking.split_text_into_chunks` for size-bounding.
- **Retrieval**: 
  - `retrieve(query, corpus, top_k=5)` uses standard-library-only BM25 ranking without requiring a vector DB or external API.
  - `retrieve_hybrid(..., llm=)` fuses embedding similarity and an LLM reranker when a key is configured, gracefully degrading tier-by-tier otherwise (see [25-hybrid-retrieval.md](./25-hybrid-retrieval.md)).
- **Answering Questions**: `answer_question(query, history=, docs_dir=, llm=, top_k=5)` retrieves passages via `retrieve_hybrid()` and operates under specific modes:
  - `mode: "generated"`: Used when `OPENAI_API_KEY` is configured; hands retrieved excerpts to the chat model using `CHAT_SYSTEM_PROMPT` to answer strictly from the excerpts with `[1]`, `[2]` citations.
  - `mode: "extractive"`: Fallback mode used without an API key (or if the call fails), building an extractive answer directly from top retrieved passages for zero-[configuration](./configuration.md) chat support.
  - `mode: "empty"`: Triggered when nothing has been compiled yet.
  - `mode: "no_match"`: Triggered when the corpus lacks content relevant to the query.
- **API Endpoints**:
  - `POST /api/chat` (body: `{"message": str, "history": [{"role", "content"}, ...]}`)
  - `GET /api/chat/status` (returns corpus size and LLM configuration status)

## Related Entities
- `rag_engine.py`
- `linker.py`
- `text_chunking.split_text_into_chunks`
- `POST /api/chat`
- `GET /api/chat/status`

## Related Concepts
- Retrieval-Augmented Generation ([RAG](./rag.md))
- BM25 ranking
- Hybrid retrieval and LLM reranking
- Extractive fallback mechanisms
- Heading-scoped passage splitting

## Contradictions
*(None present in the provided sources)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

---
id: chat-rag-engine
title: Chat RAG Engine
tags:
  - chat-rag-engine
  - extractive-fallback
  - heading-scoped-passages
  - hybrid-retrieval
  - rag-citation-linking
  - rag-enginepy
  - resource-tracking
last_updated: "2026-09-10T14:37:38.688611+00:00"
sidebar_label: Chat RAG Engine
slug: /chat-rag-engine
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Chat RAG Engine

## Overview
The Chat / [RAG engine](./rag-engine.md) (`rag_engine.py`) is responsible for answering questions over the compiled wiki (`wiki-app/docs/`)—utilizing the cross-linked network established by `linker.py` instead of operating directly over raw pipeline chunks. This design ensures that every citation points to a clickable wiki page. The system is designed to gracefully degrade depending on available [API](./api.md) keys and [configuration](./configuration.md), supporting both AI-generated responses and zero-configuration extractive fallbacks.

## Key Details
The RAG engine core operations and functions are managed through several key components:

- **Corpus Building**: `build_corpus(docs_dir=OUTPUT_DIR)` loads every compiled page and splits it into heading-scoped passages. It reuses `text_chunking.split_text_into_chunks` for proper size-bounding.
- **Retrieval Methods**: 
  - `retrieve(query, corpus, top_k=5)` performs standard BM25 ranking using standard libraries only, eliminating the need for a vector database or external APIs.
  - `retrieve_hybrid(..., llm=)` fuses embedding similarity and an LLM reranker when an API key is configured, degrading gracefully tier-by-tier otherwise. Refer to [25-hybrid-retrieval.md](./25-hybrid-retrieval.md) for the complete design and evaluation details.
- **Question Answering**: `answer_question(query, history=, docs_dir=, llm=, top_k=5)` retrieves passages using `retrieve_hybrid()` and processes them according to the current environment configuration:
  - **Generated Mode**: When `OPENAI_API_KEY` is configured, retrieved excerpts are passed to the chat model utilizing `CHAT_SYSTEM_PROMPT` to answer strictly from the excerpts and cite them using markdown notation (e.g., `[1]`, `[2]`).
  - **Extractive Fallback Mode**: Without an API key (or if the call fails), the engine falls back to an **extractive** answer built directly from the top retrieved passages. This preserves zero-setup functionality consistent with the broader repository's approach to missing keys.
  - **Empty/No Match Modes**: Returns `mode: "empty"` when no pages have been compiled yet, or `mode: "no_match"` when the corpus contains nothing relevant to the query.
- **[API Endpoints](./api-endpoints.md)**: 
  - `POST /api/chat` (accepts a body of `{"message": str, "history": [{"role", "content"}, ...]}`)
  - `GET /api/chat/status` (provides corpus size and configuration state regarding the LLM).

## Related Entities
- **[Resources Engine](./resources-engine.md) (`resources_engine.py`)**: An inverse engine tracking what cites specific sources (emails, notes, images) as deduped entries rather than tracking what a page cites. Exposed via `GET /api/resources` and `GET /api/resources/{path}`.
- **Mailbox & Email Parsing**: Operates independently of compilation runs by parsing headers straight from raw `.eml` files placed in `data/raw/` (`GET /api/emails` and `GET /api/emails/{path}`).

## Related Concepts
- **Hybrid Retrieval & Reranking**: Combining BM25, embedding similarity, and LLM-based reranking for precise passage retrieval.
- **Heading-Scoped Passage Splitting**: Segmenting documents based on markdown headers to maintain contextual relevance during retrieval.
- **Extractive Fallback**: Ensuring application continuity and usability in offline or unconfigured states.

## Contradictions
*No contradictions or conflicts identified in the current source corpus.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/articles/20-email-resources-and-chat-engines.md` | text | Unverified |

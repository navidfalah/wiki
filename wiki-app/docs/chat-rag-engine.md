---
id: chat-rag-engine
title: Chat RAG Engine
tags:
  - chat-rag-engine
  - extractive-fallback
  - heading-scoped-passage-splitting
  - hybrid-retrieval
  - rag-enginepy
  - wiki
last_updated: "2026-09-06T15:19:31.233391+00:00"
sidebar_label: Chat RAG Engine
slug: /chat-rag-engine
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Chat RAG Engine

## Overview
The Chat [RAG](./rag.md) Engine (`rag_engine.py`) provides question-answering capabilities over the compiled wiki (`wiki-app/docs/`), utilizing the cross-linked network built by `linker.py`. By operating over compiled pages rather than raw pipeline chunks, every citation corresponds directly to a clickable wiki page.

## Key Details
- **Corpus Building (`build_corpus`)**: Loads every compiled page from the documents directory (`docs_dir=OUTPUT_DIR`) and splits it into heading-scoped passages, leveraging `text_chunking.split_text_into_chunks` for size bounding.
- **Retrieval Mechanisms**: 
  - `retrieve(query, corpus, top_k=5)`: Utilizes standard library BM25 ranking without requiring a vector database or external [API](./api.md).
  - `retrieve_hybrid(..., llm=)`: Fuses BM25 with embedding similarity and an LLM reranker when configured, degrading gracefully tier-by-tier if unavailable. Further design details and evaluations can be found in `25-hybrid-retrieval.md`.
- **Answering Modes (`answer_question`)**:
  - **Generated (`mode: "generated"`)**: Used when `OPENAI_API_KEY` is configured; passes retrieved excerpts to the chat model using `CHAT_SYSTEM_PROMPT` to restrict answers strictly to the excerpts and cite them as `[1]`, `[2]`, etc.
  - **Extractive (`mode: "extractive"`)**: Used when an API key is absent or calls fail; constructs an extractive answer directly from the top retrieved passages, maintaining zero-API-setup functionality.
  - **Empty (`mode: "empty"`)**: Triggered when no pages have been compiled yet.
  - **No Match (`mode: "no_match"`)**: Triggered when the corpus contains nothing relevant to the query.
- **[API Endpoints](./api-endpoints.md)**:
  - `POST /api/chat`: Accepts a JSON body containing `{"message": str, "history": [{"role", "content"}, ...]}`.
  - `GET /api/chat/status`: Exposes status metrics, including corpus size and whether an LLM is configured.

## Related Entities
- `rag_engine.py`
- `linker.py`
- `text_chunking.split_text_into_chunks`
- `wiki-app/docs/`

## Related Concepts
- Hybrid Retrieval
- BM25 Ranking
- Extractive Fallback
- Heading-Scoped Passage Splitting
- [RAG](./rag.md) (Retrieval-Augmented Generation)

## Contradictions
*(No contradictions present in the current source data)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

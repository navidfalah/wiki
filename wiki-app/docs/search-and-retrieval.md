---
id: search-and-retrieval
title: Search and Retrieval
tags:
  - extractive-fallback
  - extractive-fallback-chat-mode
  - heading-scoped-passage-splitting
  - heading-scoped-passages
  - hybrid-retrieval
  - rag-enginepy
  - search-and-retrieval
  - wiki
last_updated: "2026-09-10T14:40:28.734284+00:00"
sidebar_label: Search and Retrieval
slug: /search-and-retrieval
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Search and Retrieval

## Overview

The search and retrieval capabilities of the wiki are powered by the Chat/[RAG engine](./rag-engine.md) (`rag_engine.py`). Rather than operating over raw pipeline chunks, the engine answers questions directly over the compiled wiki (`wiki-app/docs/`)—utilizing the cross-linked network established by `linker.py`—ensuring that every citation corresponds to an actual, clickable wiki page.

## Key Details

The [RAG](./rag.md) engine implements core processing, retrieval, and answering functions:

- **Corpus Building (`build_corpus`)**: Loaded from `docs_dir=OUTPUT_DIR`, every compiled page is split into heading-scoped passages. Size-bounding is handled by reusing `text_chunking.split_text_into_chunks`.
- **Retrieval (`retrieve` & `retrieve_hybrid`)**: 
  - `retrieve(query, corpus, top_k=5)` performs BM25 ranking using only the standard library, eliminating the requirement for a vector database or external [API](./api.md).
  - `retrieve_hybrid(..., llm=)` fuses embedding similarity and an LLM reranker when an API key is provided, while gracefully degrading tier-by-tier if it is missing. Further design details and evaluations against the previous TF-IDF-style scorer are available in [25-hybrid-retrieval.md](./25-hybrid-retrieval.md).
- **Question Answering (`answer_question`)**: Retrieves passages using `retrieve_hybrid()`, then operates under several operational modes:
  - **`mode: "generated"`**: Active when `OPENAI_API_KEY` is configured. Retrieved excerpts are provided to the chat model using `CHAT_SYSTEM_PROMPT` to answer strictly from the excerpts and cite them accordingly (`[1]`, `[2]`, etc.).
  - **`mode: "extractive"`**: Triggered when the API key is missing or the API call fails. An extractive answer is compiled directly from the top retrieved passages, maintaining functionality with zero API setup.
  - **`mode: "empty"`**: Returned when no content has been compiled yet.
  - **`mode: "no_match"`**: Returned when the corpus contains nothing relevant to the query.

### [API Endpoints](./api-endpoints.md)
- `POST /api/chat`: Accepts a body formatted as `{"message": str, "history": [{"role", "content"}, ...]}`.
- `GET /api/chat/status`: Returns corpus size metrics and the [configuration](./configuration.md) status of the LLM.

## Related Entities

- `rag_engine.py`
- `linker.py`
- `wiki-app/docs/`

## Related Concepts

- Hybrid Retrieval
- Heading-Scoped Passage Splitting
- Extractive Fallback Chat Mode
- BM25 Ranking

## Contradictions

*(No contradictions detected across the provided sources.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |
| 2 | `dummy-test/articles/20-email-resources-and-chat-engines.md` | text | Unverified |

---
id: retrieval-systems
title: Retrieval Systems
tags:
  - extractive-fallback
  - heading-scoped-passage-splitting
  - hybrid-retrieval
  - rag-enginepy
  - retrieval-systems
  - wiki
last_updated: "2026-09-06T15:22:42.942420+00:00"
sidebar_label: Retrieval Systems
slug: /retrieval-systems
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Retrieval Systems

## Overview

The retrieval and chat engine implementation (`rag_engine.py`) provides question-answering capabilities directly over a compiled wiki (`wiki-app/docs/`) built by the cross-linked network of `linker.py`. By operating over compiled pages rather than raw pipeline chunks, every generated citation links directly to a human-readable and clickable page.

## Key Details

- **Corpus Building:** The `build_corpus(docs_dir=OUTPUT_DIR)` function loads every compiled page and splits it into heading-scoped passages.
- **Retrieval Strategies:**
  - `retrieve(query, corpus, top_k=5)` utilizes standard library BM25 ranking without requiring a vector database or external [API](./api.md).
  - `retrieve_hybrid(..., llm=)` fuses embedding similarity and an optional LLM reranker when API keys are configured, otherwise degrading gracefully tier-by-tier. For comprehensive design details and evaluations against prior TF-IDF scorers, refer to [25-hybrid-retrieval.md](./25-hybrid-retrieval.md).
- **Answering Pipeline:** The `answer_question(query, history=, docs_dir=, llm=, top_k=5)` function processes queries using `retrieve_hybrid()` and handles responses across multiple operating modes:
  - **Generated Mode:** Active when `OPENAI_API_KEY` is configured. It passes retrieved excerpts to the chat model using `CHAT_SYSTEM_PROMPT` to constrain answers strictly to the provided excerpts with explicit citations (`[1]`, `[2]`, etc.).
  - **Extractive Fallback Mode:** Activated when an API key is missing or calls fail. It constructs an **extractive** answer directly from the top retrieved passages, permitting full chat functionality with zero API setup.
  - **Empty / No-Match Modes:** Returns `mode: "empty"` when no corpus has been compiled yet, or `mode: "no_match"` when the corpus lacks content relevant to the query.
- **[API Endpoints](./api-endpoints.md):** Exposed via `POST /api/chat` (accepting `{"message": str, "history": [{"role", "content"}, ...]}`) and `GET /api/chat/status` (reporting corpus size and LLM [Configuration](./configuration.md) status).

## Related Entities

- `linker.py`
- `rag_engine.py`

## Related Concepts

- BM25 ranking
- Embedding similarity
- LLM reranking
- Extractive fallback
- Heading-scoped passage splitting
- Hybrid retrieval

## Contradictions

*(No contradictions noted in the current sources.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

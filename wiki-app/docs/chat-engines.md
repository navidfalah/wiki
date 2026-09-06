---
id: chat-engines
title: Chat Engines
tags:
  - api-chat-endpoint
  - chat-engines
  - llmclient
  - unit-testing-without-api-keys
  - wiki
last_updated: "2026-09-06T15:19:29.073657+00:00"
sidebar_label: Chat Engines
slug: /chat-engines
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Chat Engines

## Overview
Chat engines provide the core conversational backend functionality, exposed via standard [API endpoints](./api-endpoints.md). They integrate with language models and support fallback behaviors for environments where an LLM is not configured.

## Key Details
- **API Endpoints:**
  - `POST /api/chat`: Accepts a JSON body containing a `message` string and a conversation `history` array of role-content objects (`{"role": str, "content": str}`).
  - `GET /api/chat/status`: Returns system status information, including the corpus size and whether an LLM is currently configured.
- **[Testing](./testing.md) and Unit Tests:**
  - All three engines are unit-tested without requiring an API key, consistent with the rest of the compiler.
  - Test suites include:
    - `tests/test_email_engine.py`
    - `tests/test_resources_engine.py`
    - `tests/test_rag_engine.py` (which includes a specific case exercising the extractive fallback path using `LLMClient(api_key="")`).

## Related Entities
- `tests/test_email_engine.py`
- `tests/test_resources_engine.py`
- `tests/test_rag_engine.py`
- `LLMClient`

## Related Concepts
- API chat endpoint
- Unit testing without API keys
- Extractive fallback path
- Corpus size tracking

## Contradictions
*(No contradictions present in the provided source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

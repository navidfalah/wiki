---
id: rag
title: RAG
tags:
  - api-chat-endpoint
  - llmclient
  - rag
  - teststest-email-enginepy
  - teststest-rag-enginepy
  - teststest-resources-enginepy
  - unit-testing-without-api-keys
  - wiki
last_updated: "2026-09-06T15:22:37.884962+00:00"
sidebar_label: RAG
slug: /rag
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# RAG

## Overview
Retrieval-Augmented Generation (RAG) is integrated into the system via dedicated [chat engines](./chat-engines.md) and [API endpoints](./api-endpoints.md), allowing interactions with a knowledge corpus while supporting fallback execution paths.

## Key Details
- **API Endpoints**: 
  - `POST /api/chat` (accepts request body: `{"message": str, "history": [{"role", "content"}, ...]}`)
  - `GET /api/chat/status` (exposes corpus size and whether an LLM is configured)
- **[Testing](./testing.md)**: The engine is unit-tested without requiring an [API](./api.md) key, consistent with the compiler framework. This is handled in `tests/test_rag_engine.py`, which includes specific test cases exercising the extractive fallback path with `LLMClient(api_key="")`.

## Related Entities
- `tests/test_rag_engine.py`
- `tests/test_email_engine.py`
- `tests/test_resources_engine.py`
- `LLMClient`

## Related Concepts
- API chat endpoint
- Unit testing without API keys
- Extractive fallback paths
- Wiki applications and dashboards

## Contradictions
*(No contradictions identified in the source text)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

---
id: backend-architecture
title: Backend Architecture
tags:
  - api-chat-endpoint
  - api-status-endpoint
  - backend-architecture
  - extractive-fallback-path
  - teststest-email-enginepy
  - teststest-rag-enginepy
  - teststest-resources-enginepy
  - wiki
last_updated: "2026-09-10T14:37:08.701144+00:00"
sidebar_label: Backend Architecture
slug: /backend-architecture
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Backend Architecture

## Overview

The backend architecture provides [API endpoints](./api-endpoints.md) for chat interactions and system status monitoring, while supporting robust unit [testing](./testing.md) across multiple engines. It serves as an extension to the React dashboard pages and integrates closely with multimedia email processing and the [API](./api.md) server surface.

## Key Details

- **API Endpoints:**
  - `POST /api/chat`: Accepts a request body containing `{"message": str, "history": [{"role", "content"}, ...]}`.
  - `GET /api/chat/status`: Exposes metrics such as corpus size and [configuration](./configuration.md) status regarding whether an LLM is configured.
- **Testing:**
  - All three engines undergo unit testing without requiring an API key, consistent with the rest of the compiler.
  - Test files include:
    - `tests/test_email_engine.py`
    - `tests/test_resources_engine.py`
    - `tests/test_rag_engine.py` (features a specific case exercising the extractive fallback path via `LLMClient(api_key="")`).

## Related Entities

- `tests/test_email_engine.py`
- `tests/test_resources_engine.py`
- `tests/test_rag_engine.py`

## Related Concepts

- API Chat Endpoint (`POST /api/chat`)
- API Status Endpoint (`GET /api/chat/status`)
- Extractive Fallback Path
- Multimedia Email Processing

## Contradictions

*(No contradictions identified in the provided sources.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

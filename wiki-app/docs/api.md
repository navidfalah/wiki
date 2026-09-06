---
id: api
title: API
tags:
  - api
  - api-chat-endpoint
  - llmclient
  - teststest-email-enginepy
  - teststest-rag-enginepy
  - teststest-resources-enginepy
  - unit-testing-without-api-keys
  - wiki
last_updated: "2026-09-06T15:18:53.715371+00:00"
sidebar_label: API
slug: /api
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# API

## Overview
The API component exposes core application functionality—specifically related to chat capabilities and status monitoring—via HTTP [endpoints](./api-endpoints.md). It supports integration with LLMs and enables comprehensive unit [testing](./testing.md) without requiring external API keys.

## Key Details
- **Chat Endpoint**: `POST /api/chat` accepting a request body structured as `{"message": str, "history": [{"role", "content"}, ...]}`.
- **Status Endpoint**: `GET /api/chat/status` providing system metrics such as corpus size and the [configuration](./configuration.md) status of the LLM.
- **Unit Testing**: All three engines are unit-tested without relying on an API key, consistent with the rest of the compiler. Relevant test files include:
  - `tests/test_email_engine.py`
  - `tests/test_resources_engine.py`
  - `tests/test_rag_engine.py` (which includes test cases exercising the extractive fallback path via `LLMClient(api_key="")`).

## Related Entities
- `LLMClient`
- `tests/test_email_engine.py`
- `tests/test_resources_engine.py`
- `tests/test_rag_engine.py`

## Related Concepts
- API chat endpoint
- Unit testing without API keys
- [Multimedia Email and Trust](./19-multimedia-email-and-trust.md) (covers how `.eml` files become chunks and how the References & Trust table is built)
- [API Server](./12-api-server.md) (covers the broader API surface)
- [Wiki App and Dashboards](./11-wiki-app-and-dashboards.md) (covers the React dashboard pages extended by this API)

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

---
id: testing
title: Testing
tags:
  - api-chat-endpoint
  - llmclient
  - testing
  - teststest-email-enginepy
  - teststest-rag-enginepy
  - teststest-resources-enginepy
  - unit-testing-without-api-keys
  - wiki
last_updated: "2026-09-06T15:23:15.115194+00:00"
sidebar_label: Testing
slug: /testing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Testing

## Overview
The compiler and its associated engines maintain robust test coverage, ensuring functionality can be verified reliably without external dependencies like [API](./api.md) keys. Related [API Endpoints](./api-endpoints.md) such as `POST /api/chat` and `GET /api/chat/status` complement the broader system architecture tested by these suites.

## Key Details
- **Unit Testing Without API Keys:** All three primary engines are unit-tested without requiring an API key, mirroring the testing methodology of the rest of the compiler.
- **Test Modules:**
  - `tests/test_email_engine.py`
  - `tests/test_resources_engine.py`
  - `tests/test_rag_engine.py` (explicitly includes a test case exercising the extractive fallback path utilizing `LLMClient(api_key="")`)

## Related Entities
- `tests/test_email_engine.py`
- `tests/test_resources_engine.py`
- `tests/test_rag_engine.py`
- `LLMClient`

## Related Concepts
- Unit Testing
- API Chat Endpoint
- Extractive Fallback Path

## Next
- [19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md) — how `.eml` files become chunks, and how the References & Trust table is built
- [12-api-server.md](./12-api-server.md) — the rest of the API surface
- [11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md) — the React dashboard pages this extends

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

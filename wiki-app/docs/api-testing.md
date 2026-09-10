---
id: api-testing
title: API Testing
tags:
  - api-testing
  - unit-testing
  - api-endpoints
  - rag-engine
  - email-engine
  - resources-engine
  - extractive-fallback-path
last_updated: "2026-09-10T14:36:53.508444+00:00"
sidebar_label: API Testing
slug: /api-testing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# API Testing

## Overview

The system's core engines (Email, Resources, and [RAG](./rag.md)) are exposed via two primary [API endpoints](./api-endpoints.md): `/api/chat` and `/api/chat/status`. The functionality of these engines is validated through a suite of unit tests designed to run without requiring an [API](./api.md) key, ensuring core logic can be tested independently of external services.

## Key Details

### [API Endpoints](./api-endpoints.md)

The chat and status functionalities are accessible through the following endpoints:

*   **`POST /api/chat`**: This endpoint facilitates interaction with the chat engine.
    *   **Body**: `{"message": str, "history": [{"role", "content"}, ...]}`
*   **`GET /api/chat/status`**: This endpoint provides metadata about the system's state.
    *   **Returns**: Corpus size and a boolean indicating whether an LLM is configured.

### Unit Tests

The three main engines are covered by dedicated unit tests. A key aspect of this [testing](./testing.md) strategy is that all tests are executed without a live API key.

*   **Test Files**:
    *   `tests/test_email_engine.py`
    *   `tests/test_resources_engine.py`
    *   `tests/test_rag_engine.py`
*   **Extractive Fallback Path**: The test suite for the [RAG Engine](./rag-engine.md) includes a specific case that exercises the extractive fallback mechanism. This is achieved by initializing the client with an empty API key: `LLMClient(api_key="")`.

## Related Entities

*   `tests/test_email_engine.py`: Unit tests for the Email Engine.
*   `tests/test_resources_engine.py`: Unit tests for the [Resources Engine](./resources-engine.md).
*   `tests/test_rag_engine.py`: Unit tests for the RAG Engine.

## Related Concepts

*   **Extractive Fallback Path**: A mechanism tested within the RAG engine to provide answers when a generative LLM is not available or configured.
*   **API Endpoints**: The public interface for interacting with the system, including `/api/chat` and `/api/chat/status`.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

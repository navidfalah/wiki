---
id: chat-and-rag-engine
title: Chat and RAG Engine
tags:
  - chat-and-rag-engine
  - rag-enginepy
  - rag-over-compiled-wiki
  - resource-inversion
  - resources-enginepy
  - wiki
last_updated: "2026-09-06T15:19:27.620645+00:00"
sidebar_label: Chat and RAG Engine
slug: /chat-and-rag-engine
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Chat and RAG Engine

## Overview
The Chat and [RAG](./rag.md) engine (`rag_engine.py`) provides question-answering capabilities over the compiled wiki (`wiki-app/docs/`). By operating over the cross-linked network established by `linker.py` rather than raw pipeline chunks, the engine ensures that every citation links directly to an inspectable, human-navigable page.

## Key Details
- **Target Data**: Operates over the compiled wiki documents (`wiki-app/docs/`) instead of raw text chunks.
- **Citations**: Generates citations that correspond to actual compiled pages users can click into.
- **Related Resource Management**: 
  - Managed via `resources_engine.py`, which implements *resource inversion*. While compiled pages feature deterministic references tables, `resources_engine.py` aggregates "what cites this source" to treat emails, notes, and images as independent, reusable, and inspectable entries.
  - Key functions include `parse_references_table(body)`, `list_resources(...)` (supporting search, type, and trust filters), and `get_resource_detail(...)`.
  - Exposed via REST endpoints `GET /api/resources` and `GET /api/resources/{path}`.
- **Email Ingestion**: Email headers parse directly from raw `.eml` files placed in `data/raw/` without requiring a compilation step, accessible via `GET /api/emails` and `GET /api/emails/{path}`.

## Related Entities
- `rag_engine.py`
- `resources_engine.py`
- `linker.py`
- `wiki-app/docs/`
- `data/raw/`

## Related Concepts
- Retrieval-Augmented Generation ([RAG](./rag.md))
- Resource Inversion
- Cross-linked Wiki Networks
- [API Endpoints](./api-endpoints.md) (`/api/emails`, `/api/resources`)

## Contradictions
*(No contradictions noted in the current source materials.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

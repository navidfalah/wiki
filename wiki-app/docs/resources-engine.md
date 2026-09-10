---
id: resources-engine
title: Resources Engine
tags:
  - rag-enginepy
  - resource-aggregation
  - resources-engine
  - resources-enginepy
  - wiki
  - wiki-based-rag
last_updated: "2026-09-10T14:40:21.515350+00:00"
sidebar_label: Resources Engine
slug: /resources-engine
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Resources Engine

## Overview
The Resources Engine (`resources_engine.py`) inverts the standard citation model used in synthesized wiki pages. While synthesized pages typically carry a deterministic references and trust table indicating what the page cites, the Resources Engine answers the reverse question: "what cites this source?" It aggregates resources—such as emails, notes, and images—into single deduped entries complete with lists of every citing page. This makes resources reusable and inspectable independently of which specific page first referenced them.

## Key Details
The engine provides core parsing, aggregation, and retrieval functionality:
- **`parse_references_table(body)`**: Regex-parses a page's rendered references table back into structured rows.
- **`list_resources(docs_dir=..., q=, source_type=, trust=)`**: Scans every compiled page, aggregates data by source path, and provides support for search queries, source type filters, and trust filters.
- **`get_resource_detail(source_path, docs_dir=..., raw_dir=)`**: Retrieves all citing pages alongside a raw content preview when the source file remains readable under `data/raw/`.

[API Endpoints](./api-endpoints.md) expose these capabilities directly:
- `GET /api/resources`
- `GET /api/resources/{path}`

Additionally, related raw file browsing is available for mailboxes via `GET /api/emails` and `GET /api/emails/{path}`, which parse headers straight from raw `.eml` files in `data/raw/` the moment they land, without requiring a compilation step.

## Related Entities
- `resources_engine.py`
- `rag_engine.py`

## Related Concepts
- Resource aggregation
- Wiki-based [RAG](./rag.md)
- Citation tracking
- Backlink analysis

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

---
id: email-api
title: Email API
tags:
  - email-api
  - rag-enginepy
  - resource-aggregation
  - resources-enginepy
  - wiki
  - wiki-based-rag
last_updated: "2026-09-10T14:37:55.761663+00:00"
sidebar_label: Email API
slug: /email-api
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Email API

## Overview
The Email [API](./api.md) provides programmatic access to email mailboxes and resource aggregation within the wiki-based [RAG](./rag.md) ecosystem. It enables browsing of raw `.eml` files immediately upon ingestion, as well as tracking resource citations and powering [chat engines](./chat-engines.md) over the compiled wiki network.

## Key Details
- **Email Endpoints**: 
  - `GET /api/emails`
  - `GET /api/emails/{path}`
  - Mailboxes are browsable the moment `.eml` files land in `data/raw/` without requiring a compile run, as headers parse straight from the raw files.
- **Resource Aggregation (`resources_engine.py`)**:
  - Inverts the standard citation table to answer "what cites this source" rather than "what does this page cite".
  - Consolidates every resource (email, note, image) into a single deduped entry listing all citing pages.
  - **Key Functions**:
    - `parse_references_table(body)`: Regex-parses a page's rendered references table back into rows.
    - `list_resources(docs_dir=..., q=, source_type=, trust=)`: Scans every compiled page, aggregates by source path, and supports filtering by search query, type, and trust.
    - `get_resource_detail(source_path, docs_dir=, raw_dir=)`: Provides citing pages along with a raw content preview if the source remains readable under `data/raw/`.
  - **Resource Endpoints**:
    - `GET /api/resources`
    - `GET /api/resources/{path}`
- **Chat / [RAG Engine](./rag-engine.md) (`rag_engine.py`)**:
  - Answers questions over the compiled wiki network (`wiki-app/docs/`) built by `linker.py` rather than over raw pipeline chunks.
  - Ensures every citation maps to an actual, clickable wiki page.

## Related Entities
- `resources_engine.py`
- `rag_engine.py`
- `linker.py`

## Related Concepts
- Resource Aggregation
- RAG (Retrieval-Augmented Generation)
- Email Parsing
- Citations and Trust Levels

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

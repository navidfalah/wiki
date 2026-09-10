---
id: email-resources
title: Email Resources
tags:
  - email-resources
  - rag-citation-linking
  - rag-enginepy
  - resource-tracking
  - resources-enginepy
  - wiki
last_updated: "2026-09-10T14:37:57.736096+00:00"
sidebar_label: Email Resources
slug: /email-resources
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Email Resources

## Overview
Email resources and mailbox handling within the system provide immediate browsability of raw `.eml` files without requiring a prior compilation step. Through the `resources_engine.py` and [RAG Engine](./rag-engine.md) modules, the platform tracks resources inversely—mapping which pages cite a specific resource—and enables citation-backed chat capabilities over the compiled wiki network.

## Key Details
- **Email Endpoints**: 
  - `GET /api/emails`
  - `GET /api/emails/{path}`
  - Mailboxes are browsable the moment `.eml` files land in `data/raw/`, as headers parse directly from raw files without needing a compile run.
- **Resource Engine (`resources_engine.py`)**:
  - Inverts the standard deterministic `## References & Trust` table by answering "what cites this source" instead of "what does this page cite".
  - Treats resources (emails, notes, images) as single deduped entries listing every citing page, making them reusable and inspectable independently.
  - **Key Functions**:
    - `parse_references_table(body)`: Regex-parses a page's rendered references table back into rows.
    - `list_resources(docs_dir=..., q=, source_type=, trust=)`: Scans compiled pages, aggregates by source path, and supports search, type, and trust filters.
    - `get_resource_detail(source_path, docs_dir=, raw_dir=)`: Provides citing pages alongside a raw content preview when the source is readable under `data/raw/`.
  - **Resource Endpoints**:
    - `GET /api/resources`
    - `GET /api/resources/{path}`
- **Chat / [RAG Engine](./rag-engine.md) (`rag_engine.py`)**:
  - Answers questions over the compiled wiki (`wiki-app/docs/`)—the cross-linked network built by `linker.py`—rather than raw pipeline chunks.
  - Ensures every citation corresponds to an actual, clickable page.

## Related Entities
- `resources_engine.py`
- `rag_engine.py`
- `linker.py`

## Related Concepts
- [RAG](./rag.md) Citation Linking
- Resource Tracking
- Mailbox Parsing
- [API Endpoints](./api-endpoints.md) (`/api/emails`, `/api/resources`)

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/articles/20-email-resources-and-chat-engines.md` | text | Unverified |

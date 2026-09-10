---
id: api-endpoints
title: API Endpoints
tags:
  - api-endpoints
  - rag-citation-linking
  - rag-enginepy
  - resource-tracking
  - resources-enginepy
  - wiki
last_updated: "2026-09-10T14:36:51.662717+00:00"
sidebar_label: API Endpoints
slug: /api-endpoints
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# API Endpoints

## Overview

[API](./api.md) endpoints provide programmatic access to the underlying engines and data structures of the wiki system. They expose functionalities such as browsing mailboxes, tracking resource citations across compiled pages, and querying the Retrieval-Augmented Generation ([RAG](./rag.md)) chat engine.

## Key Details

### Email Endpoints
- **`GET /api/emails`** and **`GET /api/emails/{path}`** expose raw email data.
- Neither endpoint requires a compilation step to have run; headers parse straight from the raw file, making a mailbox browsable the moment `.eml` files land in `data/raw/`.

### Resource Tracking Endpoints (`resources_engine.py`)
- **`GET /api/resources`** and **`GET /api/resources/{path}`** expose resource details.
- The underlying resource engine inverts the deterministic references table found on synthesized pages. Instead of identifying what a page cites, it tracks what cites a source (such as an email, note, or image).
- Every resource becomes a single deduped entry listing every citing page, making it reusable and inspectable independent of which page referenced it first.
- Key functions supporting these endpoints include:
  - `parse_references_table(body)`: Regex-parses a page's rendered references table back into rows.
  - `list_resources(docs_dir=..., q=, source_type=, trust=)`: Scans every compiled page, aggregates by source path, and supports search, type, and trust filters.
  - `get_resource_detail(source_path, docs_dir=..., raw_dir=)`: Returns citing pages plus a raw content preview when the source is readable under `data/raw/`.

### Chat / RAG Engine (`rag_engine.py`)
- Answers questions over the compiled wiki (`wiki-app/docs/`)—utilizing the cross-linked network built by `linker.py`—rather than over raw pipeline chunks.
- Ensures that every citation maps directly to a human-navigable page.

## Related Entities
- `resources_engine.py`
- `rag_engine.py`
- `linker.py`

## Related Concepts
- Resource Tracking
- RAG Citation Linking
- Mailbox Browsing

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/articles/20-email-resources-and-chat-engines.md` | text | Unverified |

---
id: wiki-pipeline
title: Wiki Pipeline
tags:
  - rag-citation-linking
  - rag-enginepy
  - resource-tracking
  - resources-enginepy
  - wiki
  - wiki-pipeline
last_updated: "2026-09-10T14:41:17.772095+00:00"
sidebar_label: Wiki Pipeline
slug: /wiki-pipeline
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wiki Pipeline

## Overview
The Wiki Pipeline manages the ingestion, compilation, and querying of knowledge within the wiki application. It includes specialized engines for handling raw email files, tracking resources across pages, and powering retrieval-augmented generation ([RAG](./rag.md)) chat interfaces over the compiled document network.

## Key Details

### Email Handling
- Raw `.eml` files placed in `data/raw/` are immediately browsable.
- Endpoints `GET /api/emails` and `GET /api/emails/{path}` expose email headers parsed directly from raw files without requiring a prior compilation run.

### Resources Engine (`resources_engine.py`)
Inverts standard reference tracking to show what cites a specific source rather than what a page cites:
- Aggregates resources (emails, notes, images) into single deduped entries complete with lists of all citing pages.
- `parse_references_table(body)`: Regex-parses a page's rendered references table back into structured rows.
- `list_resources(docs_dir=..., q=, source_type=, trust=)`: Scans compiled pages, aggregates by source path, and provides filtering options for search queries, source types, and trust levels.
- `get_resource_detail(source_path, docs_dir=, raw_dir=)`: Retrieves citing pages alongside a raw content preview if the source remains readable under `data/raw/`.
- Exposed via [API Endpoints](./api-endpoints.md) `GET /api/resources` and `GET /api/resources/{path}`.

### Chat / RAG Engine (`rag_engine.py`)
- Answers questions using the compiled wiki (`wiki-app/docs/`) and its cross-linked network established by `linker.py`.
- Operates over compiled pages rather than raw pipeline chunks to ensure every generated citation points directly to an accessible, clickable wiki page.

## Related Entities
- `resources_engine.py`
- `rag_engine.py`
- `linker.py`

## Related Concepts
- Resource Tracking
- RAG Citation Linking
- [API Endpoints](./api-endpoints.md) (`/api/emails`, `/api/resources`)
- Document Compilation

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/articles/20-email-resources-and-chat-engines.md` | text | Unverified |

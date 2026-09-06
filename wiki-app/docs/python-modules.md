---
id: python-modules
title: Python Modules
tags:
  - compilerdoc-utilspy
  - compileremail-enginepy
  - compilerrag-enginepy
  - compilerresources-enginepy
  - email-knowledge-ingestion
  - engine-pattern
  - python-modules
  - wiki
last_updated: "2026-09-06T15:22:34.921445+00:00"
sidebar_label: Python Modules
slug: /python-modules
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Python Modules

## Overview
The application architecture relies on several small, pure Python modules ("engines") located under the `compiler/` directory. Following a consistent design pattern, these engine modules contain no FastAPI imports, perform the core domain work independently, and are fully unit-testable on their own. They are integrated into the application via `server.py`, which acts as a thin routing layer. Additionally, shared utilities are centralized to prevent circular dependencies between engines and the main server.

## Key Details
- **Design Pattern**: Pure Python modules under `compiler/` containing no FastAPI dependencies, making them independently unit-testable.
- **`compiler/doc_utils.py`**: Houses frontmatter and topic-lookup helper functions shared across all engine modules and pre-existing raw-file/doc endpoints in `server.py`. Engine modules do not import `server.py` nor do they import each other.
- **Dashboard Sections & Engines**:
  - **[Email Knowledge Engine](./email-knowledge-engine.md) (`compiler/email_engine.py`)**: Backs the `/emails` route and treats every ingested `.eml` source as an independently browsable knowledge item.
    - `list_emails(raw_dir=RAW_DIR)`: Parses headers (via `email_ingest.parse_eml` without LLM calls) for every `.eml` file under `data/raw/`, adding pipeline status (`Processed`/`Unprocessed`), trust level (via `trust.py`), and the count of contributed compiled topics.
    - `get_email_detail(file_path, raw_dir=..., docs_dir=...)`: Retrieves full message bodies, attachments, and wiki pages synthesized from the thread's topics (`doc_utils.synthesized_pages_for_topics`). Raises `NotAnEmailError` for non-`.eml` paths and `FileNotFoundError` for missing files, which `server.py` maps to appropriate HTTP statuses.
  - **Resources Engine (`compiler/resources_engine.py`)**: Backs the `/resources` route.
  - **Chat ([RAG](./rag.md)) Engine (`compiler/rag_engine.py`)**: Backs the `/chat` route.

## Related Entities
- `compiler/email_engine.py`
- `compiler/resources_engine.py`
- `compiler/rag_engine.py`
- `compiler/doc_utils.py`
- `server.py`
- `trust.py`
- `link_overrides.py`

## Related Concepts
- FastAPI routing layers
- Engine design pattern (decoupled business logic)
- Email knowledge ingestion and parsing
- Retrieval-Augmented Generation (RAG) chat systems
- Frontmatter and topic lookup utilities

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

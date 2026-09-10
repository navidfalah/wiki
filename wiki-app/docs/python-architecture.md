---
id: python-architecture
title: Python Architecture
tags:
  - compilerdoc-utilspy
  - compileremail-enginepy
  - compilerrag-enginepy
  - compilerresources-enginepy
  - email-knowledge-engine-ingestion
  - pure-python-engine-pattern
  - python-architecture
  - serverpy
last_updated: "2026-09-10T14:40:07.712247+00:00"
sidebar_label: Python Architecture
slug: /python-architecture
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Python Architecture

## Overview
The Python architecture relies on a **pure Python engine pattern** where business logic and core data processing are decoupled from web framework concerns. Modules located under the `compiler/` directory operate independently of FastAPI, allowing them to be fully unit-tested on their own. These backend engines are then wired into `server.py` via thin routing layers. Shared utilities, such as frontmatter and topic lookup helpers, are centralized to prevent circular dependencies between engine modules and the main server.

## Key Details
- **Pure Python Engine Modules**: Engines such as `compiler/email_engine.py`, `compiler/resources_engine.py`, and `compiler/rag_engine.py` perform the real computational and data work without importing `server.py` or each other.
- **Shared Utilities (`compiler/doc_utils.py`)**: Holds core frontmatter and topic-lookup helpers used across all engine modules and pre-existing raw-file/doc endpoints.
- **Server Integration (`server.py`)**: Acts as a thin routing layer that maps HTTP requests to the respective engine modules and translates custom Python exceptions (e.g., `NotAnEmailError`, `FileNotFoundError`) into appropriate HTTP status codes.
- **[Email Knowledge Engine](./email-knowledge-engine.md) (`email_engine.py`)**:
  - Treats ingested `.eml` sources as first-class, independently browsable knowledge items.
  - `list_emails(raw_dir=RAW_DIR)`: Parses headers using `email_ingest.parse_eml` (without LLM calls) for every `.eml` file under `data/raw/`, tracking pipeline status (`Processed`/`Unprocessed`), trust level via `trust.py`, and contributed compiled topics.
  - `get_email_detail(file_path, raw_dir=..., docs_dir=...)`: Retrieves full body contents, attachments, and synthesized wiki pages via `doc_utils.synthesized_pages_for_topics`.

## Related Entities
- `compiler/email_engine.py`
- `compiler/resources_engine.py`
- `compiler/rag_engine.py`
- `compiler/doc_utils.py`
- `server.py`
- `trust.py`

## Related Concepts
- Pure Python engine pattern
- FastAPI routing and exception translation
- Email knowledge ingestion and parsing (`.eml`)
- Retrieval-Augmented Generation ([RAG](./rag.md)) [chat engines](./chat-engines.md)
- Resource exploration and frontmatter lookup

## Contradictions
*(None noted in current sources)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/articles/20-email-resources-and-chat-engines.md` | text | Unverified |

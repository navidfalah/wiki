---
id: python-modules
title: Python Modules
tags:
  - compilerdoc-utilspy
  - compileremail-enginepy
  - compilerrag-enginepy
  - compilerresources-enginepy
  - email-ingestion
  - engine-pattern
  - python-modules
  - serverpy
last_updated: "2026-09-10T14:40:09.919639+00:00"
sidebar_label: Python Modules
slug: /python-modules
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Python Modules

## Overview

The application architecture utilizes small, pure Python modules (referred to as "engines") located under the `compiler/` directory. Following the design pattern established by modules like `analytics.py`, `trust.py`, and `link_overrides.py`, these engine modules contain no FastAPI imports. This isolation allows them to perform heavy lifting and remain independently unit-testable, while `server.py` acts as a thin routing layer wiring them into the application.

## Key Details

### Dashboard Sections and Engine Mapping

| Section | Route | Engine module | Frontend |
|---|---|---|---|
| [Email knowledge engine](./email-knowledge-engine.md) | `/emails` | `compiler/email_engine.py` | `src/pages/emails.js` + `src/components/EmailEngine/` |
| Resources | `/resources` | `compiler/resources_engine.py` | `src/pages/resources.js` + `src/components/ResourcesExplorer/` |
| Chat ([RAG](./rag.md)) | `/chat` | `compiler/rag_engine.py` | `src/pages/chat.js` + `src/components/ChatEngine/` |

### Shared Utilities
`compiler/doc_utils.py` contains frontmatter and topic-lookup helpers. These utilities are shared across all engine modules as well as pre-existing raw-file and document endpoints in `server.py`. To maintain clean modular boundaries, engine modules do not import `server.py` nor do they import each other.

### Email Knowledge Engine (`email_engine.py`)
The email engine treats every ingested `.eml` source as an independently browsable knowledge item instead of a basic raw file:
- **`list_emails(raw_dir=RAW_DIR)`**: Parses headers using `email_ingest.parse_eml` (without requiring an LLM call) for all `.eml` files located under `data/raw/`. It returns each message's pipeline status (`Processed`/`Unprocessed`), its trust level evaluated via `trust.py`, and the count of topics it contributed to once compiled.
- **`get_email_detail(file_path, raw_dir=..., docs_dir=...)`**: Retrieves the full message body, attachments, and the wiki pages synthesized from the thread's topics via `doc_utils.synthesized_pages_for_topics`. 
- **Error Handling**: Raises `NotAnEmailError` for non-`.eml` paths and `FileNotFoundError` for missing files, which `server.py` translates to appropriate HTTP status codes.

## Related Entities

- `server.py`
- `compiler/doc_utils.py`
- `compiler/email_engine.py`
- `compiler/resources_engine.py`
- `compiler/rag_engine.py`

## Related Concepts

- Engine Pattern
- Email Ingestion
- RAG (Retrieval-Augmented Generation)
- Frontend Integration

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

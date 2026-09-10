---
id: dashboard-architecture
title: Dashboard Architecture
tags:
  - compilerdoc-utilspy
  - compileremail-enginepy
  - compilerrag-enginepy
  - compilerresources-enginepy
  - dashboard-architecture
  - email-ingestion
  - engine-pattern
  - serverpy
last_updated: "2026-09-10T14:37:51.788018+00:00"
sidebar_label: Dashboard Architecture
slug: /dashboard-architecture
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Dashboard Architecture

## Overview

The dashboard architecture expands the application with three specialized sections—Email, Resources, and Chat ([RAG](./rag.md))—each powered by a dedicated, pure Python module ("engine") located under the `compiler/` directory. These engines follow a decoupled design pattern (mirroring existing modules like `analytics.py`, `trust.py`, and `link_overrides.py`) containing no FastAPI imports. This allows the core logic to perform real work and remain independently unit-testable before being wired into `server.py` as a lightweight set of routes.

---

## Key Details

### Dashboard Sections and Engine Mapping

| Section | Route | Engine module | Frontend |
|---|---|---|---|
| [Email Knowledge Engine](./email-knowledge-engine.md) | `/emails` | `compiler/email_engine.py` | `src/pages/emails.js` + `src/components/EmailEngine/` |
| Resources | `/resources` | `compiler/resources_engine.py` | `src/pages/resources.js` + `src/components/ResourcesExplorer/` |
| Chat (RAG) | `/chat` | `compiler/rag_engine.py` | `src/pages/chat.js` + `src/components/ChatEngine/` |

### Shared Utilities
- **`compiler/doc_utils.py`**: Houses frontmatter and topic-lookup helpers. It is shared across all engine modules and pre-existing raw-file/doc endpoints in `server.py`. 
- **Decoupled Imports**: Engine modules do not import `server.py` nor do they import one another, maintaining a clean architectural boundary.

### Email Knowledge Engine (`email_engine.py`)
Treats ingested `.eml` sources as first-class, independently browsable knowledge items:
- `list_emails(raw_dir=RAW_DIR)`: Parses headers for every `.eml` file under `data/raw/` using `email_ingest.parse_eml` (without invoking an LLM call). It tracks pipeline status (`Processed`/`Unprocessed`), trust level via `trust.py`, and the count of topics contributed post-compilation.
- `get_email_detail(file_path, raw_dir=..., docs_dir=...)`: Retrieves the full body, attachments, and associated wiki pages synthesized from thread topics via `doc_utils.synthesized_pages_for_topics`. 
- **Error Handling**: Raises `NotAnEmailError` for non-`.eml` paths and `FileNotFoundError` for missing paths, which `server.py` maps to appropriate HTTP status codes.

---

## Related Entities

- `compiler/email_engine.py`
- `compiler/resources_engine.py`
- `compiler/rag_engine.py`
- `compiler/doc_utils.py`
- `server.py`

---

## Related Concepts

- Email Ingestion
- Retrieval-Augmented Generation ([RAG](./rag.md))
- Engine Pattern
- Modular Dashboard Design

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

---
id: dashboard-architecture
title: Dashboard Architecture
tags:
  - compilerdoc-utilspy
  - compileremail-enginepy
  - compilerrag-enginepy
  - compilerresources-enginepy
  - dashboard-architecture
  - email-knowledge-ingestion
  - engine-pattern
  - wiki
last_updated: "2026-09-06T15:19:48.666214+00:00"
sidebar_label: Dashboard Architecture
slug: /dashboard-architecture
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Dashboard Architecture

## Overview
The dashboard architecture is structured around specialized sections, each backed by a small, pure Python module (referred to as an "engine") located under the `compiler/` directory. Following a modular design pattern established by modules like `analytics.py`, `trust.py`, and `link_overrides.py`, each engine operates independently without any FastAPI imports, making them fully unit-testable. These engines are then wired into `server.py` using a thin set of routes.

Shared utility functions—such as frontmatter and topic-lookup helpers used across the dashboard sections and pre-existing raw-file/doc endpoints—are consolidated in `compiler/doc_utils.py`. To maintain clean separation of concerns, engine modules do not import `server.py` nor do they import one another.

## Key Details

### Dashboard Sections and Engine Mapping
The dashboard comprises three primary additional sections alongside their corresponding backend engines and frontend components:

| Section | Route | Engine module | Frontend |
|---|---|---|---|
| [Email knowledge engine](./email-knowledge-engine.md) | `/emails` | `compiler/email_engine.py` | `src/pages/emails.js` + `src/components/EmailEngine/` |
| Resources | `/resources` | `compiler/resources_engine.py` | `src/pages/resources.js` + `src/components/ResourcesExplorer/` |
| Chat ([RAG](./rag.md)) | `/chat` | `compiler/rag_engine.py` | `src/pages/chat.js` + `src/components/ChatEngine/` |

### Email Knowledge Engine (`email_engine.py`)
The email knowledge engine treats every ingested `.eml` source as a first-class, independently browsable knowledge item rather than a standard raw file. Its core functions include:
- **`list_emails(raw_dir=RAW_DIR)`**: Parses headers for every `.eml` file under `data/raw/` using `email_ingest.parse_eml` without requiring an LLM call. It evaluates each message's pipeline status (`Processed`/`Unprocessed`), its trust level via `trust.py`, and the count of topics it contributed after compilation.
- **`get_email_detail(file_path, raw_dir=..., docs_dir=...)`**: Retrieves the full message body, attachments, and the wiki pages synthesized from the thread's topics (leveraging `doc_utils.synthesized_pages_for_topics`). It raises `NotAnEmailError` for non-`.eml` paths and `FileNotFoundError` for missing files, which `server.py` subsequently maps to appropriate HTTP status codes.

## Related Entities
- `compiler/email_engine.py`
- `compiler/resources_engine.py`
- `compiler/rag_engine.py`
- `compiler/doc_utils.py`
- `server.py`

## Related Concepts
- Email Knowledge Ingestion
- Retrieval-Augmented Generation ([RAG](./rag.md))
- Modular Python Engine Patterns
- Wiki Page Synthesis and Frontmatter Lookup

## Contradictions
*No contradictions or conflicting specifications are currently present in the [documentation](./documentation.md).*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

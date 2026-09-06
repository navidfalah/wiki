---
id: email-knowledge-engine
title: Email Knowledge Engine
tags:
  - compilerdoc-utilspy
  - compileremail-enginepy
  - compilerrag-enginepy
  - compilerresources-enginepy
  - email-knowledge-engine
  - email-knowledge-ingestion
  - engine-pattern
  - wiki
last_updated: "2026-09-06T15:19:58.550100+00:00"
sidebar_label: Email Knowledge Engine
slug: /email-knowledge-engine
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Email Knowledge Engine

## Overview
The Email Knowledge Engine is part of a dashboard pattern backed by pure [Python Modules](./python-modules.md) located under the `compiler/` directory. Following the design of other utility modules like `analytics.py`, `trust.py`, and `link_overrides.py`, the email engine operates independently of FastAPI and server dependencies, making it fully unit-testable on its own before being wired into `server.py` as lightweight routes.

It provides functionality for the `/emails` dashboard route, serving the frontend user interface located at `src/pages/emails.js` and components in `src/components/EmailEngine/`.

## Key Details
The email engine is implemented in `compiler/email_engine.py` and treats ingested `.eml` source files as first-class, independently browsable knowledge items rather than generic raw files. Its core methods include:

- **`list_emails(raw_dir=RAW_DIR)`**: Parses headers for every `.eml` file under `data/raw/` using `email_ingest.parse_eml` (without requiring any LLM calls). It tracks:
  - Pipeline status (`Processed` or `Unprocessed`)
  - Trust level (via `trust.py`)
  - The number of topics the message has contributed to after compilation.
- **`get_email_detail(file_path, raw_dir=..., docs_dir=...)`**: Retrieves the full message body, attachments, and the wiki pages synthesized from the thread's topics using `doc_utils.synthesized_pages_for_topics`. 
  - Raises `NotAnEmailError` if given a non-`.eml` path.
  - Raises `FileNotFoundError` if the file is missing.
  - Handled by `server.py`, which translates these exceptions into appropriate HTTP status codes.

Shared helper functions for frontmatter and topic lookup across all engines reside in `compiler/doc_utils.py`, preventing circular dependencies and keeping engine modules isolated from `server.py`.

## Related Entities
- `compiler/email_engine.py`: The core pure Python module implementing email listing and detail retrieval.
- `compiler/doc_utils.py`: Shared utility module providing frontmatter and topic-lookup helpers.
- `src/pages/emails.js` & `src/components/EmailEngine/`: Frontend components supporting the email knowledge UI.
- `server.py`: Hosts the thin HTTP routes mapping to the email engine.

## Related Concepts
- **Engine Pattern**: Structuring backend logic into independent, pure Python modules that are testable in isolation from web frameworks like FastAPI.
- **Email Ingestion**: Processing `.eml` files to extract headers, track pipeline states, calculate trust levels, and link them to compiled wiki topics.
- **Knowledge Synthesis**: Mapping email threads and their discussed topics to generated wiki pages.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

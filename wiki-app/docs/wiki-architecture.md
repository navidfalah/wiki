---
id: wiki-architecture
title: Wiki Architecture
tags:
  - extactive-fallback
  - heading-scoped-passage-splitting
  - hybrid-retrieval
  - rag-enginepy
  - rag-over-compiled-wiki
  - resource-inversion
  - resources-enginepy
  - wiki
last_updated: "2026-09-06T15:23:27.640036+00:00"
sidebar_label: Wiki Architecture
slug: /wiki-architecture
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wiki Architecture

## Overview
The wiki architecture encompasses core engines designed to handle raw file ingestion, resource tracking via reference inversion, and context-aware chat capabilities built directly over the compiled wiki network rather than raw pipeline chunks.

## Key Details
- **Email Ingestion**: Endpoints like `GET /api/emails` and `GET /api/emails/{path}` parse headers straight from raw `.eml` files in `data/raw/` the moment they land, without requiring a preliminary compile run.
- **Resources Engine (`resources_engine.py`)**: 
  - Performs resource inversion: instead of tracking what a page cites, it tracks what cites a source, consolidating resources (emails, notes, images) into single deduped entries with all citing pages listed.
  - Key functions include `parse_references_table(body)` (regex-parses rendered references tables back into rows), `list_resources(...)` (scans compiled pages, aggregates by source path, and supports search, type, and trust filters), and `get_resource_detail(...)` (provides citing pages and a raw content preview if readable under `data/raw/`).
  - Exposed via `GET /api/resources` and `GET /api/resources/{path}`.
- **Chat / [RAG](./rag.md) Engine (`rag_engine.py`)**:
  - Operates over the compiled cross-linked wiki network (`wiki-app/docs/`) built by `linker.py`, ensuring every citation points to a clickable page.
  - `build_corpus(docs_dir=OUTPUT_DIR)` loads compiled pages and splits them into heading-scoped passages utilizing `text_chunking.split_text_into_chunks` for size-bounding.
  - `retrieve(query, corpus, top_k=5)` uses standard-library-only BM25 ranking without requiring a vector database or external [API](./api.md).
  - `retrieve_hybrid(..., llm=)` fuses embedding similarity and an LLM reranker when a key is configured, degrading gracefully tier-by-tier otherwise (detailed further in [25-hybrid-retrieval.md](./25-hybrid-retrieval.md)).
  - `answer_question(...)` handles query answering through multiple operation modes:
    - `mode: "generated"`: Uses `OPENAI_API_KEY` to pass retrieved excerpts to the chat model with `CHAT_SYSTEM_PROMPT` for strictly cited answers (`[1]`, `[2]`, ...).
    - `mode: "extractive"`: Falls back to an extractive answer built directly from top retrieved passages when an API key is missing or calls fail.
    - `mode: "empty"`: Triggered when nothing has been compiled yet.
    - `mode: "no_match"`: Triggered when the corpus lacks relevant content.
  - Exposed via `POST /api/chat` and `GET /api/chat/status`.

## Related Entities
- `resources_engine.py`
- `rag_engine.py`
- `linker.py`

## Related Concepts
- Hybrid retrieval
- Resource inversion
- Heading-scoped passage splitting
- Extractive fallback
- [RAG](./rag.md) over compiled wiki

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/20-email-resources-and-chat-engines.md` | text | Medium |

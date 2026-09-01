---
id: heuristic-mode
title: Heuristic Mode
tags:
  - cross-linking
  - heuristic-mode
  - ingest-quirks
  - meshsync
  - nova-widget
  - teabuddy
  - wiki
last_updated: "2026-09-01T19:19:17.250517+00:00"
sidebar_label: Heuristic Mode
slug: /heuristic-mode
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Heuristic Mode

## Overview
Heuristic Mode is a compilation feature within the LLM Wiki pipeline designed to process raw text files without requiring an LLM API key. It scans directories for `.txt` and `.md` files, extracts topics, builds cross-links based on entity mentions, and generates Docusaurus-compatible [documentation](./documentation.md) pages.

## Key Details
- **File Ingestion:** Reads all `.txt` and `.md` files located under the `data/raw/` directory.
- **API-Free Extraction:** Extracts topics and builds the wiki structure locally without invoking external LLM APIs.
- **Cross-Linking:** Automatically establishes cross-links by identifying entity mentions such as [Nova Widget](./nova-widget.md), [TeaBuddy](./teabuddy.md), and MeshSync.
- **Output Generation:** Outputs structured Docusaurus pages directly into `wiki-app/docs/`.
- **Primary Goal:** Transform over 40 raw source files into a rich graph that surfaces contradictions across domains like battery performance, herbal presets, and read intervals.

## Test Data Layout
The pipeline utilizes specific testing layouts and data categories:
- `data/raw/samples/`: Contains files prefixed with `[SAMPLE]`.
- `data/raw/dummy-test/`: Contains files labeled with `[DUMMY TEST DATA]`.
- Utilizes original junk data generated via `generate_junk_data.py`.

## Known Ingest Quirks
During the ingestion and compilation process, several parsing challenges and quirks are accounted for:
- **Broken Markdown Exports:** Used to test and evaluate parser resilience against malformed syntax.
- **Forum HTML Scrapes:** Ingested content from forum scrapes often results in the loss of nested content structures.
- **Email Threads:** Ingested email threads may occasionally incorporate wrong-thread noise.

## Related Entities
- [Nova Widget](./nova-widget.md)
- [TeaBuddy](./teabuddy.md)
- MeshSync

## Related Concepts
- [Wiki Compiler](./wiki-compiler.md)
- Karpathy Pattern
- Cross-Linking
- Data Ingestion Quirks

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-11-wiki-compiler-heuristic-notes.md` | text | Unverified |

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
last_updated: "2026-09-02T06:40:05.928473+00:00"
sidebar_label: Heuristic Mode
slug: /heuristic-mode
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Heuristic Mode

## Overview

Heuristic mode is a feature of the [Wiki Compiler](./wiki-compiler.md) pipeline designed to process raw data files and generate structured [Documentation](./documentation.md) without relying on an external Large Language Model (LLM) API key. Operating as part of the LLM Wiki pipeline test artifact, it ingests text and markdown files, extracts topics, builds cross-links between entity mentions, and generates Docusaurus-compatible pages.

## Key Details

- **File Ingestion:** Reads all `.txt` and `.md` files located under the `data/raw/` directory.
- **API Independence:** Extracts topics and builds pages without requiring an LLM API key.
- **Output Generation:** Automatically generates Docusaurus pages under the `wiki-app/docs/` directory.
- **Cross-Linking:** Constructs cross-links based on detected entity mentions, such as [Nova Widget](./nova-widget.md), [TeaBuddy](./teabuddy.md), and [MeshSync](./meshsync.md).
- **Test Data Layout:** 
  - `data/raw/samples/` contains `[SAMPLE]` prefixed files.
  - `data/raw/dummy-test/` contains `[DUMMY TEST DATA]` labeled files.
  - Includes original junk data generated via `generate_junk_data.py`.
- **Primary Goal:** Transform over 40 raw files into a rich, interconnected graph that surfaces underlying contradictions—such as discrepancies concerning [Battery Life](./battery-life.md), herbal presets, and read intervals.

## Related Entities

- [Nova Widget](#)
- [TeaBuddy](#)
- [MeshSync](#)

## Related Concepts

- [Wiki Compiler](./wiki-compiler.md)
- Karpathy Pattern
- Cross-Linking
- Ingest Quirks

## Ingest Quirks

The heuristic mode pipeline is tested against several known data irregularities and parser edge cases:
- **Broken Markdown Exports:** Used specifically to test and verify parser resilience.
- **Forum HTML Scrapes:** Result in the loss of nested content structures.
- **Email Threads:** Frequently introduce wrong-thread noise into the dataset.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-11-wiki-compiler-heuristic-notes.md` | text | Unverified |

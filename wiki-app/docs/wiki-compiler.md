---
id: wiki-compiler
title: Wiki Compiler
tags:
  - cross-linking
  - heuristic-mode
  - ingest-quirks
  - meshsync
  - nova-widget
  - teabuddy
  - wiki
  - wiki-compiler
last_updated: "2026-09-01T19:22:01.551094+00:00"
sidebar_label: Wiki Compiler
slug: /wiki-compiler
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wiki Compiler

## Overview
The Wiki Compiler is an automated pipeline component designed to process raw [documentation](./documentation.md) and transform it into a structured, interconnected knowledge base. Operating under an LLM Wiki [pipeline test](./pipeline-test.md) framework, it features a specialized [Heuristic Mode](./heuristic-mode.md) that functions without requiring an LLM API key.

## Key Details
- **Functionality:** Reads all `.txt` and `.md` files located under the `data/raw/` directory and extracts topics automatically.
- **Output:** Generates Docusaurus-compatible pages under `wiki-app/docs/` and builds cross-links from entity mentions.
- **Test Data Layout:** Organizes inputs across `data/raw/samples/` (using `[SAMPLE]` prefixed files) and `data/raw/dummy-test/` (using `[DUMMY TEST DATA]` labeled files), alongside original junk data produced by `generate_junk_data.py`.
- **Known Ingest Quirks:** 
  - Broken markdown exports test parser resilience.
  - Forum HTML scrapes lose nested content.
  - Email threads include wrong-thread noise.
- **Ultimate Goal:** Process over 40 raw files to establish a rich graph capable of surfacing contradictions (such as those regarding battery specs, herbal presets, and read intervals).

## Related Entities
- [Nova Widget](./nova-widget.md)
- [TeaBuddy](./teabuddy.md)
- MeshSync

## Related Concepts
- Cross-linking
- Heuristic mode
- Ingest quirks
- Karpathy pattern

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-11-wiki-compiler-heuristic-notes.md` | text | Unverified |

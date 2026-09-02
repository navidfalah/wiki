---
id: pipeline-test
title: "Pipeline Test: Wiki Compiler Heuristic Mode"
tags:
  - cross-linking
  - heuristic-mode
  - ingest-quirks
  - meshsync
  - nova-widget
  - pipeline-test
  - teabuddy
  - wiki
last_updated: "2026-09-02T06:41:15.892405+00:00"
sidebar_label: "Pipeline Test: Wiki Compiler Heuristic Mode"
slug: /pipeline-test
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Pipeline Test: Wiki Compiler Heuristic Mode

## Overview
This wiki page documents the operational notes, test data layout, and known ingest quirks associated with the [Heuristic Mode](./heuristic-mode.md) of the [Wiki Compiler](./wiki-compiler.md), serving as a pipeline test artifact utilizing the Karpathy pattern.

## Key Details
- **Functionality:** Reads all `.txt` and `.md` files located under `data/raw/` to extract topics without requiring an LLM API key.
- **Output:** Generates Docusaurus-compatible pages under `wiki-app/docs/`.
- **Cross-Linking:** Automatically builds cross-links based on entity mentions (such as [Nova Widget](./nova-widget.md), [TeaBuddy](./teabuddy.md), and [MeshSync](./meshsync.md)).
- **Test Data Layout:** 
  - `data/raw/samples/` contains `[SAMPLE]` prefixed files.
  - `data/raw/dummy-test/` contains `[DUMMY TEST DATA]` labeled files.
  - Original junk data generated via `generate_junk_data.py`.
- **Primary Goal:** Transform 40+ raw files into a rich knowledge graph while surfacing contradictions (such as [Battery Life](./battery-life.md), herbal presets, and read intervals).

## Related Entities
- **Nova Widget**
- **TeaBuddy**
- **MeshSync**

## Related Concepts
- **Heuristic Mode**
- **Karpathy Pattern**
- **Wiki Compiler**
- **Ingest Quirks**

## Known Ingest Quirks
- Broken markdown exports test parser resilience.
- Forum HTML scrapes tend to lose nested content.
- Email threads frequently include wrong-thread noise.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-11-wiki-compiler-heuristic-notes.md` | text | Unverified |

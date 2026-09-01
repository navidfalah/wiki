---
id: pipeline-test
title: Pipeline Test
tags:
  - cross-linking
  - heuristic-mode
  - ingest-quirks
  - meshsync
  - nova-widget
  - pipeline-test
  - teabuddy
  - wiki
last_updated: "2026-09-01T19:20:28.950723+00:00"
sidebar_label: Pipeline Test
slug: /pipeline-test
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Pipeline Test

## Overview
The Pipeline Test is an LLM Wiki pipeline test artifact designed to evaluate the [wiki compiler](./wiki-compiler.md) operating in [heuristic mode](./heuristic-mode.md). The primary goal of this initiative is to process 40+ raw files and transform them into a rich knowledge graph, complete with surfaced contradictions across topics such as [battery life](./battery-life.md), herbal presets, and read intervals.

## Key Details
- **Operation:** Reads all `.txt` and `.md` files located under `data/raw/` without requiring an LLM API key.
- **Output:** Automatically generates Docusaurus-compatible pages under `wiki-app/docs/`.
- **Cross-linking:** Automatically builds cross-links by detecting entity mentions (such as [Nova Widget](./nova-widget.md), [TeaBuddy](./teabuddy.md), and MeshSync).
- **Test Data Layout:** 
  - `data/raw/samples/` contains `[SAMPLE]` prefixed files.
  - `data/raw/dummy-test/` contains `[DUMMY TEST DATA]` labeled files.
  - Includes original junk data generated via `generate_junk_data.py`.

## Known Ingest Quirks
The pipeline tests parser resilience against several data anomalies:
- Broken markdown exports challenge parser stability.
- Forum HTML scrapes result in lost nested content.
- Email threads occasionally introduce wrong-thread noise.

## Related Entities
- [Nova Widget](./nova-widget.md)
- [TeaBuddy](./teabuddy.md)
- MeshSync

## Related Concepts
- [Heuristic Mode](./heuristic-mode.md)
- Cross-linking
- Ingest Quirks
- Karpathy Pattern

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-11-wiki-compiler-heuristic-notes.md` | text | Unverified |

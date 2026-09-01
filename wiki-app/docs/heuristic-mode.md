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
last_updated: "2026-09-01T21:23:25.809082+00:00"
sidebar_label: Heuristic Mode
slug: /heuristic-mode
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Heuristic Mode

## Overview

Heuristic Mode is a feature of the [wiki compiler](./wiki-compiler.md) designed to process raw files and generate structured [documentation](./documentation.md) without requiring an LLM API key. Developed as part of the LLM Wiki pipeline testing (utilizing the Karpathy pattern), its primary objective is to transform 40+ raw files into a rich, interconnected knowledge graph that explicitly surfaces contradictions such as [battery life](./battery-life.md), herbal presets, and read intervals.

## Key Details

- **Data Processing:** Reads all `.txt` and `.md` files located under `data/raw/` to extract topics autonomously.
- **Output Generation:** Automatically generates Docusaurus-compatible pages under `wiki-app/docs/`.
- **Cross-Linking:** Builds automated cross-links based on entity mentions throughout the text (including references to [Nova Widget](./nova-widget.md), [TeaBuddy](./teabuddy.md), [MeshSync](./meshsync.md), and others).
- **Test Data Layout:** 
  - `data/raw/samples/` contains `[SAMPLE]` prefixed files.
  - `data/raw/dummy-test/` contains `[DUMMY TEST DATA]` labeled files.
  - Incorporates original junk data generated via `generate_junk_data.py`.
- **Known Ingest Quirks:**
  - Broken markdown exports test parser resilience.
  - Forum HTML scrapes tend to lose nested content.
  - Email threads often include wrong-thread noise.

## Related Entities

- [Nova Widget](./nova-widget.md)
- [TeaBuddy](./teabuddy.md)
- [MeshSync](./meshsync.md)

## Related Concepts

- LLM Wiki Pipeline
- Karpathy Pattern
- Knowledge Graph Compilation
- Automated Cross-Linking

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-11-wiki-compiler-heuristic-notes.md` | text | Unverified |

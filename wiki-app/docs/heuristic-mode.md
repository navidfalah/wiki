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
last_updated: "2026-09-10T14:38:40.654916+00:00"
sidebar_label: Heuristic Mode
slug: /heuristic-mode
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Heuristic Mode

## Overview

Heuristic mode is an operational state of the [Wiki Compiler](./wiki-compiler.md) designed to process raw data and generate [Documentation](./documentation.md) without requiring an LLM [API](./api.md) key. Operating as part of the LLM Wiki [Pipeline Test Artifact](./pipeline-test-artifact.md), it reads source files, extracts topics, builds Docusaurus pages, and automatically maps cross-links across recognized entity mentions.

## Key Details

- **Input Processing:** Reads all `.txt` and `.md` files located under the `data/raw/` directory.
- **Page Generation:** Automatically outputs generated Docusaurus pages directly into `wiki-app/docs/`.
- **Cross-Linking:** Dynamically builds cross-links by detecting entity mentions such as [Nova Widget](./nova-widget.md), [TeaBuddy](./teabuddy.md), and [MeshSync](./meshsync.md) within the text.
- **Test Data Layout:** Organizes inputs across `data/raw/samples/` (containing `[SAMPLE]` prefixed files) and `data/raw/dummy-test/` (containing `[DUMMY TEST DATA]` labeled files), alongside original junk data produced by `generate_junk_data.py`.
- **Primary Goal:** Transform over 40 raw files into a rich, interconnected graph that surfaces underlying contradictions—specifically regarding metrics like battery, herbal presets, and read intervals.

## Related Entities

- [Nova Widget](#)
- [TeaBuddy](#)
- [MeshSync](#)

## Related Concepts

- Wiki Compiler
- Karpathy Pattern
- Cross-Linking
- Ingest Quirks

## Contradictions

- The [Wiki Pipeline](./wiki-pipeline.md) aims to surface contradictions embedded in the source data, explicitly highlighting conflicting details concerning system properties such as [Battery Specifications](./battery-specifications.md), herbal presets, and read intervals.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-11-wiki-compiler-heuristic-notes.md` | text | Unverified |

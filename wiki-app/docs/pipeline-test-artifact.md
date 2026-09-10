---
id: pipeline-test-artifact
title: Pipeline Test Artifact
tags:
  - aurora-labs
  - heuristic-mode
  - meshsync
  - nova-widget
  - pipeline-test-artifact
  - teabuddy
  - wiki
  - wiki-compiler
last_updated: "2026-09-10T14:39:34.230390+00:00"
sidebar_label: Pipeline Test Artifact
slug: /pipeline-test-artifact
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Pipeline Test Artifact

## Overview
The [Pipeline Test](./pipeline-test.md) Artifact serves as a test subject for the [wiki compiler's](./wiki-compiler.md) [heuristic mode](./heuristic-mode.md) under the Karpathy pattern. It is designed to validate the transformation of raw files into a structured graph of Docusaurus pages, including the surface-level detection of contradictions.

## Key Details
- **Context:** LLM [Wiki pipeline](./wiki-pipeline.md) test artifact.
- **Goal:** Process 40+ raw files into a rich graph that successfully surfaces contradictions (such as battery, herbal preset, and read interval discrepancies).
- **Heuristic Mode Functions:**
  - Reads all `.txt` and `.md` files located under `data/raw/`.
  - Extracts topics without requiring an LLM [API](./api.md) key.
  - Generates Docusaurus pages directly under `wiki-app/docs/`.
  - Builds cross-links based on entity mentions.
- **Test Data Layout:**
  - `data/raw/samples/`: Contains `[SAMPLE]` prefixed files.
  - `data/raw/dummy-test/`: Contains `[DUMMY TEST DATA]` labeled files.
  - Includes original junk data generated via `generate_junk_data.py`.
- **Known Ingest Quirks:**
  - Broken markdown exports test parser resilience.
  - Forum HTML scrapes experience nested content loss.
  - Email threads contain wrong-thread noise.

## Related Entities
- [Nova Widget](./nova-widget.md)
- [TeaBuddy](./teabuddy.md)
- [MeshSync](./meshsync.md)

## Related Concepts
- [Wiki Compiler](./wiki-compiler.md)
- [Heuristic Mode](./heuristic-mode.md)
- Karpathy Pattern
- Pipeline Test Artifact

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-11-wiki-compiler-heuristic-notes.md` | text | Unverified |

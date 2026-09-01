---
id: wiki-automation
title: Wiki Automation
tags:
  - aurora
  - auto-ingest
  - ble
  - cr2032
  - graph-diff
  - jonah
  - karpathy
  - llm-faq-summarization
last_updated: "2026-09-01T19:21:59.765942+00:00"
sidebar_label: Wiki Automation
slug: /wiki-automation
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wiki Automation

## Overview

The Wiki Automation initiative encompasses a collection of ideas, cross-product standardization goals, and architectural references aimed at streamlining [Documentation](./documentation.md) maintenance, ingestion, and cross-functional terminology. Inspired by the Karpathy LLM wiki pattern and Docusaurus graph plugins, the project seeks to leverage automation tools, linters, and LLMs to keep knowledge bases synchronized and clean.

## Key Details

The automation roadmap includes several core functional components and cross-product initiatives:

* **Pre-commit Hook:** Automatically greps raw files for any `CONTRADICTION` markers to catch discrepancies before they are committed.
* **Auto-Ingest:** Automatically processes and ingests Slack exports from the `dummy-test/` folder.
* **Graph Diff:** Computes graph differences between compiles to highlight newly introduced entities.
* **LLM FAQ Summarization:** Uses Large Language Models to summarize support tickets directly into FAQ pages.
* **Orphan Page Linter:** A maintenance tool already prioritized on the backlog as item #1.

### Cross-Product Initiatives
* **Shared Glossary:** Establishes common definitions for terms such as `CR2032`, [BLE](./ble.md), MeshSync, and `steep preset`.
* **Unified Manifesto:** Creates a unified "local-first manifesto" page combining quotes from [Aurora Labs](./aurora-labs.md) and [TeaBuddy](./teabuddy.md).

### Rejected Ideas
* **Single App:** Merging both products into a single application was rejected after the CEOs said no.
* **Mesh Tea Timer:** The concept of a mesh tea timer was explicitly vetoed by Jonah, who stated "absolutely not."

## Related Entities

* **Aurora:** Product associated with the local-first manifesto and cross-product documentation.
* **TeaBuddy:** Product associated with the local-first manifesto.
* **Jonah:** Leadership figure who vetoed the mesh tea timer project.

## Related Concepts

* **Auto-ingest:** Automated pipeline for bringing external data (such as Slack exports) into the wiki ecosystem.
* **Graph Diff:** Visualization and tracking of entity relationships changing between compilation cycles.
* **LLM FAQ Summarization:** Automated conversion of raw support ticket text into structured knowledge base articles.
* **Local-first Manifesto:** A philosophical statement combining quotes from multiple product lines.
* **[Hardware](./hardware.md) & Technical Terms:** Standardized terminology including CR2032 batteries, [BLE](./ble.md) ([Bluetooth Low Energy](./bluetooth-low-energy.md)), MeshSync, and steep presets.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/ideas/[SAMPLE]-2026-07-04-wiki-automation-ideas.txt` | text | Unverified |

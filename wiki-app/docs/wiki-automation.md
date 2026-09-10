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
last_updated: "2026-09-10T14:41:11.155689+00:00"
sidebar_label: Wiki Automation
slug: /wiki-automation
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wiki Automation

## Overview
Wiki automation encompasses a set of proposed features, tools, and cross-product initiatives aimed at streamlining [documentation](./documentation.md) maintenance, content ingestion, and cross-referencing. Inspired by patterns such as the Karpathy LLM wiki pattern and Docusaurus graph plugins, the automation ideas focus on reducing manual overhead while maintaining structured, high-quality knowledge bases.

## Key Details
The proposed wiki automation ideas and cross-product efforts are categorized into operational enhancements, cross-product content sharing, and explicitly rejected proposals:

### Proposed Automation Features
* **Pre-commit hook:** Grep raw files to detect and flag `CONTRADICTION` markers before commits are finalized.
* **Auto-ingest:** Automatically ingest Slack exports placed within the `dummy-test/` folder.
* **Graph diffs:** Generate graph comparisons between compilation states to highlight newly introduced entities.
* **LLM summarization:** Utilize Large Language Models (LLMs) to process and summarize [support tickets](./support-tickets.md) into structured FAQ pages.
* **Orphan page linter:** A utility to detect disconnected or unlinked pages (already prioritized on backlog item #1).

### Cross-Product Initiatives
* **Shared glossary:** Establish a unified glossary covering technical terms and concepts such as `CR2032`, [BLE](./ble.md), [MeshSync](./meshsync.md), and the `steep preset`.
* **Unified manifesto:** Create a dedicated "[local-first](./local-first.md) manifesto" page incorporating quotes from Aurora and [TeaBuddy](./teabuddy.md).

### Rejected Proposals
* **Single application:** Combining both products into a single app was explicitly rejected by the CEOs.
* **Mesh tea timer:** Proposed mesh tea timer concept was rejected outright by Jonah ("absolutely not").

## Related Entities
* **Aurora**
* **TeaBuddy**
* **Jonah**

## Related Concepts
* **[BLE](./ble.md)**
* **CR2032**
* **[MeshSync](./meshsync.md)**
* **LLM-FAQ-Summarization**
* **Graph-Diff**

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/ideas/[SAMPLE]-2026-07-04-wiki-automation-ideas.txt` | text | Unverified |

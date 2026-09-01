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
last_updated: "2026-09-01T21:26:05.787592+00:00"
sidebar_label: Wiki Automation
slug: /wiki-automation
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wiki Automation

## Overview
This page outlines a collection of automation ideas, cross-product initiatives, and rejected proposals for enhancing [documentation](./documentation.md) workflows, heavily influenced by the Karpathy LLM wiki pattern and Docusaurus graph plugins.

## Key Details
The proposed wiki automation and maintenance features include:
* **Pre-commit hook:** Grep raw source files to detect any `CONTRADICTION` markers before committing.
* **Auto-ingest:** Automatically process Slack exports originating from the `dummy-test/` folder.
* **Graph diffing:** Compare graph structures between compiles to explicitly highlight newly added entities.
* **LLM summarization:** Use large language models to distill support tickets directly into structured FAQ pages.
* **Orphan page linter:** Clean up unlinked pages (which is already tracked on backlog item #1).

## Related Entities
* **[Aurora](./nova-widget.md):** A product referenced in the cross-product local-first manifesto initiative.
* **[TeaBuddy](./teabuddy.md):** A product referenced alongside Aurora for unified quotes.
* **Jonah:** Product leadership who vetoed specific [hardware](./hardware.md)/feature proposals.
* **Karpathy:** Inspiration for the underlying LLM wiki pattern.

## Related Concepts
* **CR2032 & [BLE](./ble.md):** Shared glossary terms identified for cross-product documentation.
* **[MeshSync](./meshsync.md) & Steep Preset:** Additional domain-specific terminology included in the shared glossary.
* **Local-first manifesto:** A unified documentation page combining quotes from Aurora and TeaBuddy.
* **Docusaurus graph plugin:** Referenced tooling used for visualization and graph-based documentation patterns.

## Contradictions
*(No contradictions reported in the source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/ideas/[SAMPLE]-2026-07-04-wiki-automation-ideas.txt` | text | Unverified |

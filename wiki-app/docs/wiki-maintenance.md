---
id: wiki-maintenance
title: Wiki Maintenance
tags:
  - wiki
  - docusaurus
  - documentation-pipeline
  - wiki-linter
  - explicit-contradiction-documentation
  - meshsync
  - meshsink
  - battery-state-indicator
last_updated: "2026-09-01T21:26:09.033599+00:00"
sidebar_label: Wiki Maintenance
slug: /wiki-maintenance
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wiki Maintenance

## Overview
Wiki maintenance encompasses the processes, tools, and backlog items related to keeping [Documentation](./documentation.md) organized, up to date, and structurally sound. This includes managing pipelines for compiling raw text notes into Docusaurus-compatible markdown files, addressing structural issues like orphan pages, and documenting conflicting facts explicitly within wiki pages.

## Key Details
* **Documentation Pipeline:** A half-baked automation pipeline exists to compile raw text (`.txt`) notes into markdown (`.md`) files formatted for Docusaurus.
* **Orphan Detection:** Orphan pages are considered detrimental to the wiki's structure, and a wiki linter is proposed to automatically identify them.
* **Explicit Contradictions:** Best practices for the wiki dictate that contradictions should be documented explicitly rather than glossed over or overwritten.
* **Index Maintenance:** A persistent operational issue across projects is that `index.md` files consistently fall out of date.

## Related Entities
* **Docusaurus:** The static site generator used for rendering the wiki documentation.
* **[MeshSync](./meshsync.md) / MeshSink:** A naming debate involving the component `MeshSync`. A proposed rename to `MeshSink` has been explicitly rejected three times.

## Related Concepts
* **Wiki Linter:** A proposed automated tool to scan the documentation repository for structural issues, specifically targeting orphan pages.
* **Explicit Contradiction Documentation:** A practice of explicitly capturing and maintaining known opposing facts or conflicting viewpoints directly inside wiki pages.

## Contradictions
* **MeshSync Naming:** There is a historical tension surrounding the identifier `MeshSync`. While a suggestion was made to rename it to `MeshSink`, this proposal has been rejected three separate times, cementing the `MeshSync` name.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `ideas/backlog-shower-thoughts.txt` | text | Medium |

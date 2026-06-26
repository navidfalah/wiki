---
id: wiki-automation
title: Wiki Automation
tags:
  - aurora
  - auto-ingest
  - ble
  - ceos
  - contradiction-marker
  - cr2032
  - docusaurus
  - docusaurus-graph-plugin
last_updated: "2026-06-25T08:05:02.458818+00:00"
sidebar_label: Wiki Automation
slug: /wiki-automation
---

# Wiki Automation

## Overview

Wiki automation refers to the implementation of tools and processes designed to streamline the creation, maintenance, and enhancement of wiki content. This includes automating tasks such as content ingestion, quality control, summarization, and cross-referencing, aiming to improve efficiency, accuracy, and user experience. Various ideas have been proposed, ranging from pre-commit hooks for content validation to leveraging Large Language Models (LLMs) for content generation and summarization.

## Key Details

### Proposed Automation Ideas

Several specific automation ideas have been suggested to improve wiki management:

*   **Pre-commit Hook for Contradiction Markers**: Implement a pre-commit hook that greps raw wiki files for a `CONTRADICTION` marker, helping to identify and address conflicting information before it's committed.
*   **Automated Slack Export Ingestion**: Develop a system to automatically ingest Slack exports from designated folders (e.g., `dummy-test/`) into the wiki, converting conversational data into structured content.
*   **Graph Diff for New Entities**: Generate a graph difference between wiki compiles to visually highlight and track newly introduced entities, aiding in content discovery and organization.
*   **LLM Summarization for FAQ Pages**: Utilize Large Language Models (LLMs) to summarize support tickets and similar communications, transforming them into concise FAQ pages.
*   **Orphan Page Linter**: Implement a linter to identify "orphan pages" (pages not linked from any other page), which is already noted on backlog #1.

### Cross-Product Initiatives

Automation efforts also extend to fostering consistency and collaboration across different products:

*   **Shared Glossary**: Create a unified glossary for common terms and components such as CR2032, BLE, MeshSync, and "steep preset," ensuring consistent definitions across documentation.
*   **Unified "Local-First Manifesto" Page**: Develop a single, comprehensive page detailing the "local-first manifesto," incorporating quotes and perspectives from products like Aurora and TeaBuddy.

### Rejected Initiatives

Not all automation ideas proceed; some are explicitly rejected:

*   **Single App for Both Products**: The idea of developing a single application to serve both products was rejected by the CEOs.
*   **Mesh Tea Timer**: A proposal for a "mesh tea timer" was explicitly rejected by Jonah.

### References and Inspirations

Key inspirations and reference points for wiki automation include:

*   **Karpathy LLM Wiki Pattern**: The patterns and approaches used by Karpathy for LLM-driven wiki content.
*   **Docusaurus Graph Plugin**: The capabilities of the Docusaurus graph plugin for visualizing relationships and structures within wiki content.

## Related Entities

*   Aurora (product)
*   TeaBuddy (product, implied)
*   CEOs (decision-makers)
*   Jonah (decision-maker)
*   Karpathy (influencer/researcher)

## Related Concepts

*   Pre-commit hooks
*   Large Language Models (LLM)
*   Graph databases/visualization
*   Local-first manifesto
*   Content ingestion
*   FAQ generation
*   Orphan page detection
*   Shared glossaries
*   Docusaurus (wiki framework)

## Contradictions

No direct contradictions in factual information regarding wiki automation were identified in the provided source material. The "rejected" items represent discarded proposals rather than conflicting facts about the automation process itself.

## Sources

*   `samples/ideas/[SAMPLE]-2026-07-04-wiki-automation-ideas.txt`

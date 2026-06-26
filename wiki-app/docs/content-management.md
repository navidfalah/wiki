---
id: content-management
title: Content Management
tags:
  - wiki automation
  - content ingestion
  - knowledge management
  - cross-product content
  - llm applications
  - docusaurus
  - pre-commit hooks
  - glossary
last_updated: "2026-06-25T07:17:17.640490+00:00"
sidebar_label: Content Management
slug: /content-management
---

# Content Management

This page outlines various ideas and initiatives related to managing content, particularly within a wiki system, focusing on automation, cross-product collaboration, and content organization.

## Overview

Effective content management is crucial for maintaining up-to-date, consistent, and easily accessible information. This includes strategies for automating content ingestion, identifying new entities, summarizing information, and ensuring consistency across different product lines. The concepts discussed here aim to streamline the process of creating, organizing, and maintaining knowledge bases.

## Key Details

### Wiki Automation Ideas

Several ideas have been proposed to automate and improve wiki content management:

*   **Pre-commit Hook for Contradiction Markers**: Implement a pre-commit hook that greps raw wiki files for a `CONTRADICTION` marker, helping to identify and address conflicting information before it's committed.
*   **Automated Slack Export Ingestion**: Develop a system to auto-ingest Slack exports from specific folders (e.g., `dummy-test/`) directly into the wiki, converting conversational data into structured content.
*   **Graph Diff for New Entities**: Utilize graph analysis to identify and display new entities that emerge between different compiles of the wiki, aiding in content discovery and organization.
*   **LLM Summarization for FAQ Pages**: Leverage Large Language Models (LLMs) to summarize support tickets, transforming common issues and solutions into comprehensive FAQ pages.
*   **Orphan Page Linter**: Implement a linter to identify and flag "orphan pages" – wiki pages that are not linked from any other page – to improve navigability and content discoverability. This is already on the backlog (#1).

### Cross-Product Content Initiatives

To foster consistency and shared knowledge across different products, the following initiatives are being considered:

*   **Shared Glossary**: Establish a unified glossary for common terms and components, including `CR2032`, `BLE`, `MeshSync`, and `steep preset`, ensuring consistent terminology across all documentation.
*   **Unified "Local-First Manifesto" Page**: Create a single, comprehensive page detailing the "local-first manifesto," incorporating quotes and perspectives from both Aurora and TeaBuddy products to present a cohesive vision.

### Rejected Ideas

Some ideas related to product and content management have been considered and subsequently rejected:

*   **Single App for Both Products**: The proposal to develop a single application to serve both product lines was rejected by the CEOs.
*   **Mesh Tea Timer**: The concept of a "mesh tea timer" product was rejected by Jonah, who stated "absolutely not."

### References and Inspirations

The development of these content management strategies draws inspiration from:

*   **Karpathy LLM Wiki Pattern**: A pattern for leveraging LLMs in wiki environments, as described by Karpathy.
*   **Docusaurus Graph Plugin**: A Docusaurus plugin that likely facilitates graph-based analysis and visualization of wiki content.

## Related Entities

*   **Aurora**: A product mentioned in the context of the "local-first manifesto."
*   **TeaBuddy**: A product mentioned in the context of the "local-first manifesto."
*   **CR2032**: A specific component or term to be included in a shared glossary.
*   **BLE**: (Bluetooth Low Energy) A technology or term for the shared glossary.
*   **MeshSync**: A technology or term for the shared glossary.
*   **Docusaurus**: A static site generator, likely used for the wiki, with a relevant graph plugin.
*   **Karpathy**: Associated with an LLM wiki pattern.
*   **Jonah**: Rejected the "mesh tea timer" idea.
*   **CEOs**: Rejected the "single app for both products" idea.

## Related Concepts

*   Wiki Automation
*   Knowledge Management
*   Content Ingestion
*   Large Language Model (LLM) Applications
*   Cross-Product Strategy
*   Local-First Manifesto
*   Pre-commit Hooks
*   Graph Databases and Analysis
*   Orphan Content Detection
*   Glossary Management

## Contradictions

No direct contradictions were found within the provided source material. However, the concept of a "CONTRADICTION marker" is proposed as a tool to identify and manage conflicting information within the wiki content itself.

## Sources

*   `samples/ideas/[SAMPLE]-2026-07-04-wiki-automation-ideas.txt`

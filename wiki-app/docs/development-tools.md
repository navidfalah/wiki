---
id: development-tools
title: Development Tools
tags:
  - aurora
  - auto-ingest
  - ble
  - ceos
  - contradiction-marker
  - cr2032
  - development-tools
  - docusaurus
last_updated: "2026-06-25T07:20:37.728131+00:00"
sidebar_label: Development Tools
slug: /development-tools
---

# Development Tools

## Overview

Development tools encompass a wide range of software, processes, and methodologies designed to enhance efficiency, collaboration, and quality throughout the software development lifecycle. This page outlines various ideas and initiatives related to development tools, specifically focusing on [Wiki Automation](./wiki_automation.md) and cross-product development strategies. These tools aim to streamline documentation, improve knowledge sharing, and foster consistency across different product lines.

## Key Details

### Wiki Automation Initiatives

Several ideas have been proposed to automate and improve wiki management and content generation:

*   **Pre-commit Hook for Contradiction Markers:** Implement a [Pre-commit Hooks](./pre_commit_hooks.md) that greps raw wiki files for a `CONTRADICTION` marker. This helps identify and address potential inconsistencies before they are committed.
*   **Automated Slack Export Ingestion:** Develop a system to automatically ingest Slack exports from designated folders (e.g., `dummy-test/`) to capture discussions and decisions for wiki content.
*   **Graph Diff for Compiles:** Create a tool to generate a [Graph Diff](./graph_diff.md) between different compile outputs, highlighting newly introduced entities. This aids in tracking changes and understanding system evolution.
*   **LLM Summarization for Support Tickets:** Utilize [Large Language Models](./large_language_models.md) ([LLMs](./large_language_models.md)) to summarize support tickets, transforming them into structured [FAQ](./faq.md) pages for easier access and knowledge dissemination.
*   **Orphan Page Linter:** Implement a linter to identify and flag "[Orphan Pages](./orphan_pages.md)" within the wiki – pages that are not linked from any other page. This initiative is already on the backlog (#1).

### Cross-Product Development Concepts

To foster consistency and collaboration across different products, several cross-product initiatives have been identified:

*   **Shared Glossary:** Establish a [Shared Glossary](./shared_glossary.md) for common terms and components, including:
    *   [CR2032](./cr2032.md) (a common battery type)
    *   [BLE (Bluetooth Low Energy)](./ble_bluetooth_low_energy.md)
    *   [MeshSync](./meshsync.md) (a synchronization mechanism)
    *   [Steep Preset](./steep_preset.md) (a specific configuration or setting)
*   **Unified "Local-First Manifesto" Page:** Create a single, comprehensive page detailing the "[Local-First Manifesto](./local_first_manifesto.md)," incorporating quotes and perspectives from both [Aurora](./aurora.md) and [TeaBuddy](./teabuddy.md) product teams.

### Rejected Development Initiatives

Not all development ideas proceed. The following initiatives were considered but ultimately rejected:

*   **Single Application for Both Products:** The idea of merging both products into a single application was rejected by the [CEOs](./ceos.md).
*   **Mesh Tea Timer:** A proposal for a "Mesh tea timer" product was explicitly rejected by [Jonah](./jonah.md), who stated "absolutely not."

## Related Entities

*   **Aurora:** A product mentioned in the context of the "local-first manifesto."
*   **TeaBuddy:** A product mentioned alongside Aurora for the "local-first manifesto."
*   **CEOs:** Key decision-makers who rejected the single application idea.
*   **Jonah:** An individual who rejected the "Mesh tea timer" idea.
*   **[Karpathy](./karpathy.md):** Referenced for the "LLM wiki pattern."
*   **[Docusaurus](./docusaurus.md):** A documentation framework, referenced for its "graph plugin."

## Related Concepts

*   **Wiki Automation:** The overarching theme for several proposed tools, focusing on streamlining wiki content creation and maintenance.
*   **Pre-commit Hooks:** Automated scripts that run before a code commit, used here for content validation.
*   **[Auto-ingestion](./auto_ingestion.md):** The process of automatically importing data from external sources.
*   **Graph Diff:** A method for visualizing and comparing differences between graph structures.
*   **[LLM Summarization](./llm_summarization.md):** Using Large Language Models to condense information.
*   **FAQ:** Frequently Asked Questions, a common format for knowledge bases.
*   **Orphan Pages:** Wiki pages that are not linked from any other page, indicating potential discoverability issues.
*   **Shared Glossary:** A centralized list of terms and definitions for consistency.
*   **Local-First Manifesto:** A philosophy or set of principles emphasizing local data storage and processing.
*   **BLE (Bluetooth Low Energy):** A wireless communication technology.
*   **MeshSync:** A specific synchronization protocol or technology.
*   **CR2032:** A standard coin cell battery type.
*   **Steep Preset:** A predefined configuration or setting.

## Contradictions

No direct factual contradictions were found in the provided source material. The "Rejected Development Initiatives" section details decisions made against certain ideas, rather than conflicting facts.

## Sources

*   `samples/ideas/[SAMPLE]-2026-07-04-wiki-automation-ideas.txt`

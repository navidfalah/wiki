---
id: configuration
title: Configuration
tags:
  - agentsmd
  - aurora-labs-wiki
  - configuration
  - data-archiving
  - force-execution
  - wiki
last_updated: "2026-09-06T15:19:39.584311+00:00"
sidebar_label: Configuration
slug: /configuration
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Configuration

## Overview
The configuration process involves setting up the environment, managing source data directories, updating site metadata, and ensuring that agent [documentation](./documentation.md) remains synchronized with domain changes.

## Key Details
- **Data Management:** Remove or archive the `data/raw/` directory to prepare for new data.
- **Source Integration:** Add custom sources into the setup.
- **Execution:** Run the main application with the force flag using the command: `python main.py --force`.
- **Site Metadata:** Update the title within `wiki-app/docusaurus.config.js` from "[Aurora Labs Wiki](./aurora-nova-widget.md)" to your custom title.
- **Agent Synchronization:** Keep the `AGENTS.md` domain section in sync so that agents remain aware of the topic updates.

## Related Entities
- `data/raw/`
- `wiki-app/docusaurus.config.js`
- `AGENTS.md`

## Related Concepts
- Data Archiving
- Force Execution
- Documentation Site Configuration

## Contradictions
*(No contradictions present in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `18-sample-domain.md` | text | Medium |

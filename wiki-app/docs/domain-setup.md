---
id: domain-setup
title: Domain Setup
tags:
  - agentsmd
  - aurora-labs-wiki
  - data-archiving
  - domain-setup
  - force-execution
  - wiki
last_updated: "2026-09-06T15:19:55.047545+00:00"
sidebar_label: Domain Setup
slug: /domain-setup
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Domain Setup

## Overview
Domain setup involves configuring a new domain or customizing an existing template within the wiki framework. This includes clearing default data, incorporating custom sources, running generation scripts, and updating [Configuration](./configuration.md) settings to reflect the new wiki title.

## Key Details
- **Data Cleanup:** Remove or archive the default `data/raw/` directory to prepare for new data.
- **Source Integration:** Add your own custom sources into the pipeline.
- **Force Execution:** Run the main execution script with the force flag to process the new setup:
  ```bash
  python main.py --force
  ```
- **Configuration Updates:** Update the title in `wiki-app/docusaurus.config.js` from the default "[Aurora Labs](./aurora-labs.md) Wiki" to match your specific domain.
- **Agent Synchronization:** Keep the `AGENTS.md` domain section in sync so that any agents are properly informed about your topic.

## Related Entities
- `data/raw/`
- `wiki-app/docusaurus.config.js`
- `AGENTS.md`

## Related Concepts
- Data Archiving
- Force Execution
- [Wiki Configuration](./wiki-configuration.md)

## Contradictions
*(No contradictions noted in the provided sources)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `18-sample-domain.md` | text | Medium |

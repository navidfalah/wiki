---
id: project-initialization
title: Project Initialization
tags:
  - agentsmd
  - aurora-labs-wiki
  - data-archiving
  - force-execution
  - project-initialization
  - wiki
last_updated: "2026-09-06T15:22:26.329556+00:00"
sidebar_label: Project Initialization
slug: /project-initialization
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Project Initialization

## Overview
Project initialization outlines the initial setup and [configuration](./configuration.md) steps required when setting up a new domain or project instance within the repository structure.

## Key Details
To initialize a project or domain, follow these core steps:
1. **Data Management:** Remove or archive the existing `data/raw/` directory.
2. **Source Integration:** Add your own custom sources to the project.
3. **Execution:** Run the main script utilizing the force flag: `python main.py --force`.
4. **Configuration Update:** Update the title in `wiki-app/docusaurus.config.js` from the default "[Aurora Labs](./aurora-labs.md) Wiki" to your project-specific title.
5. **Agent Synchronization:** Keep the `AGENTS.md` domain section in sync to ensure automated agents are aware of your topic.

## Related Entities
- `data/raw/`
- `wiki-app/docusaurus.config.js`
- `AGENTS.md`
- `main.py`

## Related Concepts
- [09-test-data-generation.md](./09-test-data-generation.md)
- [01-overview.md](./01-overview.md)

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `18-sample-domain.md` | text | Medium |

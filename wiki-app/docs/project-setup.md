---
id: project-setup
title: Project Setup
tags:
  - agentsmd
  - aurora-labs-wiki
  - project-initialization
  - project-setup
  - wiki
last_updated: "2026-09-10T14:40:04.357626+00:00"
sidebar_label: Project Setup
slug: /project-setup
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Project Setup

## Overview
The project setup process involves initializing your workspace, cleaning up default [sample data](./sample-data.md), and configuring project-specific metadata such as titles and domain files to prepare the repository for custom use.

## Key Details
- **Clean up data:** Remove or archive the default `data/raw/` directory.
- **Add sources:** Integrate your own custom data sources into the project.
- **Run initialization:** Execute `python main.py --force` to process the setup.
- **Configure wiki:** Update the wiki title in `wiki-app/docusaurus.config.js` from "[Aurora Labs](./aurora-labs.md) Wiki" to your desired project title.
- **Sync agent [documentation](./documentation.md):** Keep the `AGENTS.md` domain section synchronized so that agents are informed about your specific topic and domain context.

## Related Entities
- `data/raw/`
- `main.py`
- `wiki-app/docusaurus.config.js`
- `AGENTS.md`

## Related Concepts
- [Project initialization](./project-initialization.md)
- Data management
- [Wiki configuration](./wiki-configuration.md)
- Agent synchronization

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `18-sample-domain.md` | text | Medium |

---
id: project-management
title: Project Management
tags:
  - aurora
  - aurora-labs
  - auto-ingest
  - backlog-grooming
  - ble
  - contradiction-linter
  - cr2032
  - data-sync-frequency-contradiction
last_updated: "2026-09-10T14:40:02.875353+00:00"
sidebar_label: Project Management
slug: /project-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Project Management

## Overview
Project management tracking for [Aurora Labs](./aurora-labs.md) covers [sprint planning](./sprint-planning.md), retrospectives, and cross-[product ideas](./product-ideas.md) involving the Aurora widget and related [hardware](./hardware.md)/software efforts. Key design focuses include making the hardware feel like garden equipment rather than surveillance, maintaining stable mesh synchronization, and executing [beta testing](./beta-testing.md) preparations under the guidance of core team members Jonah and [Mira](./aurora-nova-widget-v2.md).

## Key Details
- **Hardware & Design Decisions:** 
  - The [Nova widget](./nova-widget.md) enclosure pebble shape was approved by Jonah, aiming for a garden-equipment aesthetic.
  - Planned beta injection molding material is PETG (noted by Jonah if fundraising succeeds).
  - Component and technical mentions include CR2032 batteries, [BLE](./ble.md), and nRF52840 vs. nRF5340 evaluations.
- **[MeshSync](./meshsync.md) Operations:** 
  - The name "MeshSync" is finalized despite multiple rejected attempts to rename it (e.g., MeshSink).
  - Rejoin storms at 8 nodes still reproduce, showing current spikes from 110µA to 340µA on parent swaps.
  - [TeaBuddy](./teabuddy.md) partnership cross-product integration ideas (such as a mesh tea timer or "smart garden tea") have been repeatedly rejected.
- **Data Export & Integrations:** 
  - [MQTT export](./mqtt-export.md) with optional CSV dashboards is requested by Mira, ensuring it remains strictly non-mandatory.
- **Wiki & Tooling Automation Ideas:** 
  - Pre-commit hooks for grepping raw files for CONTRADICTION markers, auto-ingesting Slack exports, graph diffs, LLM-based support ticket FAQs, and orphan page linters.

## Related Entities
- **Aurora Labs**
- **Jonah** (Core team member; oversees hardware choices, naming decisions, and power/mesh profiling)
- **Mira** (Core team member; fixed sleep regressions, handles mesh profiling and dashboard preferences)
- **TeaBuddy** (Cross-product reference, distinct team with rejected co-[marketing](./marketing.md)/integration requests)
- **[SenseNode SN-400](./sensenode-sn-400.md)** (Competitive comparison target)

## Related Concepts
- **[MeshSync Protocol](./meshsync-protocol.md)**
- **BLE & Power Budgets** (Tracking rejoin current spikes and sleep states)
- **Sprint Retrospectives & Planning**
- **[Wiki Automation](./wiki-automation.md) & Contradiction Linters**

## Contradictions
&gt; **Contradiction:** [Documentation](./documentation.md) states an hourly default data sync frequency, whereas the primary specification demands a 15-minute interval. This conflict must be resolved before beta testing.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |
| 2 | `samples/ideas/[SAMPLE]-2026-07-04-wiki-automation-ideas.txt` | text | Unverified |
| 3 | `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt` | text | Unverified |
| 4 | `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt` | text | Unverified |
| 5 | `samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt` | text | Unverified |

---
id: software-architecture
title: Software Architecture
tags:
  - data-sync-frequency-contradiction
  - export-and-dashboard-requirements
  - jonah
  - mesh-sync
  - mira
  - software-architecture
  - widget-design-philosophy
  - wiki
last_updated: "2026-09-01T21:25:37.316180+00:00"
sidebar_label: Software Architecture
slug: /software-architecture
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Software Architecture

## Overview
This wiki page captures architectural and design decisions based on recent voice memo transcriptions regarding [Hardware](./hardware.md)-software integration, data synchronization, and user interface philosophy.

## Key Details
- **Widget Design Philosophy:** The widget interface should evoke a sense of physical garden equipment rather than corporate or surveillance tools.
- **Manufacturing & Materials:** Jonah noted that PETG material should be used for the beta phase, transitioning to injection molding later if additional funding is raised.
- **Core Technology & Naming:** The underlying synchronization protocol is officially named "Mesh Sync" (referred to repeatedly as "mesh sync mesh sync mesh sync"), and the name is finalized and locked against further renaming.
- **Export & Dashboard Requirements:** [Nova Widget](./nova-widget.md) requested [MQTT Export](./mqtt-export.md) capabilities along with optional CSV export. The dashboard must remain strictly optional and never mandatory for users.

## Related Entities
- **Jonah:** Team member responsible for manufacturing and material specifications (PETG and injection molding).
- **Mira:** Team member who specified requirements regarding MQTT/CSV data exports and optional dashboard usage.

## Related Concepts
- **Mesh Sync:** The core synchronization protocol and framework for the platform.
- **Widget Design:** Tactile, garden-equipment-inspired user interface and hardware styling.

## Contradictions
&gt; **Contradiction:** There is an unresolved discrepancy regarding the data synchronization frequency (hourly versus fifteen-minute intervals), which must be resolved before releasing to beta testers.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |

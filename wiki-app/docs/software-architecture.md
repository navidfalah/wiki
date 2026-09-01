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
last_updated: "2026-09-01T19:21:32.476153+00:00"
sidebar_label: Software Architecture
slug: /software-architecture
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Software Architecture

## Overview
This wiki page captures architectural and design considerations for an ongoing project, synthesized from voice memo transcriptions. It outlines design philosophy, [hardware](./hardware.md) considerations, [networking](./networking.md) nomenclature, data synchronization parameters, and user-facing export requirements.

## Key Details
* **Widget Design Philosophy:** The physical and software interface for the widget should evoke the feeling of "garden equipment" rather than "surveillance."
* **Hardware & Production:** Jonah noted that PETG material should be used for the beta phase, transitioning to injection molding later if [fundraising](./fundraising.md) goals are met.
* **Networking & Naming:** The underlying synchronization protocol and project feature has been officially named **Mesh Sync** (with explicit instructions to keep the name and avoid renaming it further).
* **Export & Dashboard Requirements:** According to Mira, the system must support [MQTT export](./mqtt-export.md) and optional CSV exports. Furthermore, the dashboard must remain strictly optional and never mandatory for users.

## Related Entities
* **Jonah:** Team member focused on [hardware specifications](./hardware-specifications.md), material selection (PETG), and manufacturing pathways (injection molding).
* **Mira:** Stakeholder who specified requirements regarding MQTT export, optional CSV functionality, and non-mandatory dashboard usage.

## Related Concepts
* **Mesh Sync:** The core synchronization mechanism designated for the architecture.
* **Hardware Prototyping:** The use of beta-phase PETG before scaling to mass-market injection molding.
* **User-Centric Design:** Blending physical aesthetics (garden equipment feel) with flexible data management (optional dashboards and standard exports).

## Contradictions
&gt; **Contradiction:** There is an unresolved conflict regarding data synchronization frequency—specifically whether updates should occur hourly versus every fifteen minutes—which must be resolved prior to releasing the software to beta testers.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |

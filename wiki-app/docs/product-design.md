---
id: product-design
title: Product Design
tags:
  - data-sync-frequency-contradiction
  - export-and-dashboard-requirements
  - jonah
  - mesh-sync
  - mira
  - product-design
  - widget-design-philosophy
  - wiki
last_updated: "2026-09-10T14:39:45.158019+00:00"
sidebar_label: Product Design
slug: /product-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Design

## Overview
This page compiles product design decisions, [hardware](./hardware.md) material notes, and stakeholder preferences based on internal voice memo transcriptions. It outlines the core aesthetic philosophy for the hardware widget, [manufacturing](./manufacturing.md) plans for the beta phase, network naming decisions, and software export/dashboard requirements.

## Key Details
- **Widget Design Philosophy:** The physical device and its interface are intended to evoke the feel of "garden equipment" rather than "surveillance" technology.
- **Manufacturing & Materials:** According to Jonah, PETG will be utilized for the beta phase, with plans to transition to injection molding later if additional funding is raised.
- **[Product Naming](./product-naming.md):** The working name "[Mesh Sync](./meshsync.md)" is locked in; it has been decided that it will not be renamed again.
- **Software & Data Requirements:** Mira requests that [MQTT export](./mqtt-export.md) and CSV export options be included, and emphasizes that the dashboard should remain optional and never mandatory.

## Related Entities
- **Jonah:** Team member who specified the manufacturing material (PETG) and future injection molding roadmap.
- **Mira:** Stakeholder who defined the requirements for MQTT/CSV exports and the non-mandatory dashboard.
- **Mesh Sync:** The final, approved product name.

## Related Concepts
- **Hardware Prototyping:** Utilizing PETG for beta-stage physical builds before scaling to injection molding.
- **Data Export & Telemetry:** Optional MQTT and CSV data exports paired with an entirely non-mandatory dashboard.
- **Industrial Design Ethos:** Designing consumer-facing hardware to feel approachable and utilitarian (like garden equipment) instead of intrusive.

## Contradictions
&gt; **Contradiction:** There is an unresolved discrepancy regarding the data synchronization frequency, specifically noting "hourly versus fifteen minutes" which needs to be resolved before onboarding beta testers.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |

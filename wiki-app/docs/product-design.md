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
last_updated: "2026-09-01T21:24:45.681850+00:00"
sidebar_label: Product Design
slug: /product-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Design

## Overview
This wiki page captures foundational product design decisions, manufacturing notes, naming conventions, and specific feature requirements for upcoming [beta-testing](./beta-testing.md) releases, synthesized from voice memo transcriptions.

## Key Details
- **Widget Design Philosophy:** The widget should evoke the feel of garden equipment rather than surveillance technology.
- **Manufacturing & Materials:** Jonah specified using PETG for beta phase injection molding, with plans to revisit this if additional [fundraising](./fundraising.md) is raised.
- **Naming:** The feature name "Mesh Sync" is locked in; no further [product-naming](./product-naming.md) is permitted.
- **Exports & Dashboards:** [Mira](./nova-widget.md) requested [MQTT export](./mqtt-export.md) capabilities alongside optional CSV exports. The dashboard must remain strictly optional and never mandatory for users.

## Related Entities
- **Jonah:** Team member responsible for manufacturing and materials input (PETG specification).
- **Mira:** Stakeholder providing requirements for data exports (MQTT, optional CSV) and dashboard usage.

## Related Concepts
- **Widget Design:** Crafting user-facing [hardware](./hardware.md) aesthetics to feel approachable ("garden equipment" paradigm).
- **Manufacturing Phases:** Moving from rapid prototyping/beta injection molding (PETG) to future production options.
- **Data Synchronization:** Managing backend update frequencies and communication [protocols](./protocols.md).

## Contradictions
&gt; **Contradiction:** There is an unresolved discrepancy regarding the data synchronization frequency, specifically between hourly updates versus fifteen-minute intervals. This must be resolved before releasing to beta testers.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |

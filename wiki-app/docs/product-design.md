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
last_updated: "2026-09-01T19:20:41.509269+00:00"
sidebar_label: Product Design
slug: /product-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Design

## Overview
This wiki page outlines key product design notes, aesthetic directions, architectural naming decisions, and functional requirements captured from team voice memos regarding [hardware](./hardware.md) and software development phases leading up to [beta testing](./beta-testing.md).

## Key Details
* **Widget Design Philosophy:** The physical widget should evoke the feeling of "garden equipment" rather than "surveillance."
* **Materials & Manufacturing:** Jonah noted that PETG should be used for the beta phase, with injection molding planned for later stages if additional funding is raised.
* **[Product Naming](./product-naming.md):** The working name "Mesh Sync" is confirmed and finalized; the team agreed not to rename it further.
* **Export and Dashboard Requirements:** [Mira](./aurora-labs.md) requested [MQTT export](./mqtt-export.md) capabilities, optional CSV exports, and ensured that the dashboard remains entirely optional rather than mandatory.

## Related Entities
* **Jonah:** Team member responsible for hardware/manufacturing specifications (PETG for beta, injection molding).
* **Mira:** Team member defining software export and dashboard requirements (MQTT, optional CSV, non-mandatory dashboard).
* **Mesh Sync:** The confirmed, finalized name for the product or core feature.

## Related Concepts
* **Beta Preparation:** Planning hardware materials (PETG) and resolving configuration discrepancies prior to opening the product to beta testers.
* **Device Aesthetics:** Balancing utilitarian design aesthetics (garden equipment style) against intrusive form factors (surveillance device perception).
* **Data Interoperability:** Providing flexible export [protocols](./protocols.md) (MQTT, CSV) and user-controlled dashboard utilization.

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding data synchronization frequency, specifically between hourly syncs versus fifteen-minute syncs. This must be resolved before releasing the product to beta testers.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |

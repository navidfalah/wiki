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
last_updated: "2026-09-02T06:41:27.351828+00:00"
sidebar_label: Product Design
slug: /product-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Design

## Overview
This wiki page outlines key product design decisions, [hardware](./hardware.md) considerations, synchronization requirements, and feature preferences based on recent team notes and voice memos.

## Key Details
- **Widget Design Philosophy:** The widget should evoke the feel of garden equipment rather than surveillance technology.
- **Hardware & Manufacturing:** Jonah noted that PETG material should be used for the beta phase, with injection molding planned for a later stage if the team successfully raises funds.
- **[Product Naming](./product-naming.md):** The working name "Mesh Sync" is confirmed and should remain unchanged.
- **Exports and Dashboards:** According to [Mira](./aurora-nova-widget-v2.md), [MQTT Export](./mqtt-export.md) and optional CSV export should be supported, and the dashboard must never be made mandatory.

## Related Entities
- **Jonah:** Team member who provided the hardware and manufacturing specifications (PETG for beta, injection molding for post-raise).
- **Mira:** Team member who specified the requirements for MQTT export, optional CSV export, and non-mandatory dashboard access.
- **Mesh Sync:** The official and final product name.

## Related Concepts
- **Widget Design:** Designing physical interfaces to feel organic and approachable (like garden equipment) rather than intrusive.
- **Data Export & Telemetry:** Supporting flexible data [Protocols](./protocols.md) (MQTT, optional CSV) and ensuring user-facing dashboards remain optional.

## Contradictions
&gt; **Contradiction:** There is an unresolved discrepancy regarding the data synchronization frequency, specifically between hourly updates versus fifteen-minute intervals. This must be resolved before releasing to beta testers.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |

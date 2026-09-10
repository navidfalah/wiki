---
id: software-features
title: Software Features
tags:
  - data-export-requirements
  - industrial-design-language
  - jonah
  - mesh-sync
  - mira
  - polling-frequency-contradiction
  - software-features
  - wiki
last_updated: "2026-09-10T14:40:42.973869+00:00"
sidebar_label: Software Features
slug: /software-features
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Software Features

## Overview
This wiki page outlines the core software features, [hardware](./hardware.md) prototyping details, and design language requirements discussed during recent product planning sessions. It consolidates informal voice memo transcriptions into actionable notes regarding system synchronization, data export options, and industrial design goals.

## Key Details
* **Industrial Design Language:** The widget interface and hardware aesthetic should evoke "garden equipment" rather than "surveillance" equipment.
* **[Manufacturing](./manufacturing.md) & Materials:** Jonah specified the use of PETG for [beta testing](./beta-testing.md), transitioning to injection molding at a later stage if additional funding is raised.
* **[Mesh Sync](./meshsync.md):** The synchronization feature is officially named "Mesh Sync." The name is finalized and should not be changed again.
* **Data Export & Dashboards:** Per Mira's requirements, [MQTT export](./mqtt-export.md) and CSV export options must be supported. The dashboard should remain optional and should never be mandatory for users.

## Related Entities
* **Jonah:** Team member responsible for manufacturing and material specifications (PETG / injection molding).
* **Mira:** Team member who outlined requirements for MQTT export, CSV export, and optional dashboards.

## Related Concepts
* **Industrial Design:** Balancing hardware and software aesthetics to avoid a surveillance-like feel in favor of a garden equipment motif.
* **Data Pipelines:** Supporting flexible telemetry export via MQTT and CSV alongside a non-mandatory web dashboard.
* **Beta Readiness:** Preparing components like PETG enclosures and resolving [configuration](./configuration.md) conflicts ahead of beta tester deployment.

## Contradictions
&gt; **Contradiction:** There is an unresolved discrepancy regarding the polling frequency, which is noted as either hourly versus fifteen minutes. This must be resolved before releasing the software to beta testers.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |

---
id: release-notes
title: Release Notes
tags:
  - aurora-labs
  - jonah-park
  - meshsync
  - mira-chen
  - mqtt-export-schema-v2
  - nova-widget
  - parent-election-logging
  - power-spike-reduction
last_updated: "2026-09-10T14:40:18.004369+00:00"
sidebar_label: Release Notes
slug: /release-notes
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Release Notes

## Overview
This wiki page captures the official release notes and related details for the [MeshSync firmware](./meshsync-firmware.md) update (version 0.3.8) by [Aurora Labs](./aurora-labs.md), detailing highlights, breaking changes, known issues, and miscellaneous project notes.

## Key Details
- **Release Date:** July 2, 2026
- **Firmware Version:** 0.3.8
- **Highlights:**
  - Rejoin storm mitigation implemented for meshes exceeding 6 nodes (addressing a known issue since beta).
  - Parent election logging now exports RSSI and hop count via debug UART.
  - Power spike on rejoin reduced from 340µA to 180µA (noting it remains above the 110µA target).
- **Breaking Changes:**
  - Default read interval remains set to **15 minutes** (correcting initial kickoff slides that incorrectly stated hourly).
  - Introduction of [MQTT export](./mqtt-export.md) schema v2 (optional, local broker only).
- **Known Issues:**
  - Networks with 8+ nodes remain unstable in field reports (tracked under ticket #2099).
  - [Battery life](./battery-life.md) expectations differ: engineering estimates 18 months at 10 nodes, while [marketing](./marketing.md) messaging may still claim 2 years.

## Related Entities
- **Aurora Labs:** The organization behind the MeshSync firmware and [Nova Widget](./nova-widget.md) ecosystem.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Firmware owner.
- **Jonah Park:** QA sign-off owner.
- **Sam Rivera:** Inquired about integrating tea timers into MeshSync.

## Related Concepts
- **MeshSync:** Firmware framework managing device mesh communication, rejoin storms, and power usage.
- **Nova Widget:** [Hardware](./hardware.md) device/widget associated with the Aurora Labs release tagging.
- **MQTT Export Schema v2:** Optional local-broker-only data export format introduced in this release.
- **Parent Election Logging:** Diagnostic capability exporting RSSI and hop counts via debug UART.
- **Power Spike Reduction:** Efforts to minimize current draw during device rejoin events.

## Contradictions
*(No explicit internal contradictions were found in the provided source chunk; however, a minor discrepancy exists between internal [documentation](./documentation.md) targets: power spike reduction achieved 180µA against a 110µA target, and engineering/marketing diverge on estimated battery life).*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `2026-07-02-aurora-meshsync-release-notes.md` | text | Medium |

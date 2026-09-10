---
id: meshsync-firmware
title: MeshSync Firmware
tags:
  - aurora-labs
  - jonah-park
  - meshsync
  - meshsync-firmware
  - mira-chen
  - mqtt-export-schema-v2
  - nova-widget
  - parent-election-logging
last_updated: "2026-09-10T14:39:14.920089+00:00"
sidebar_label: MeshSync Firmware
slug: /meshsync-firmware
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MeshSync Firmware

## Overview

[MeshSync](./meshsync.md) [Firmware](./firmware.md) 0.3.8 is an [Aurora Labs](./aurora-labs.md) release aimed at addressing stability, [power consumption](./power-consumption.md), and [debugging](./debugging.md) capabilities in [mesh networking](./mesh-networking.md) environments. Led by Mira Chen (firmware) with QA sign-off from Jonah Park, this release introduces crucial mitigations for rejoin storms and power spikes, alongside updated telemetry schemas and parent election logging.

## Key Details

- **Release Date:** July 2, 2026
- **Rejoin Storm Mitigation:** Implemented to handle network reconnections when the mesh exceeds 6 nodes (addressing a known issue since [beta testing](./beta-testing.md)).
- **Parent Election Logging:** RSSI and hop count are now exported via debug UART.
- **Power Optimization:** Power spike on rejoin reduced from 340µA to 180µA, though this remains above the 110µA target.
- **Default Read Interval:** Remains at **15 minutes** (correcting kickoff slides that incorrectly stated hourly intervals).
- **[MQTT Export](./mqtt-export.md) Schema v2:** Introduced as an optional feature for local brokers only.
- **[Battery Life](./battery-life.md) Estimates:** Engineering estimates 18 months at 10 nodes, while [marketing](./marketing.md) continues to cite a 2-year lifespan.

## Related Entities

- **Mira Chen:** Firmware owner for the MeshSync release.
- **Jonah Park:** QA sign-off owner.
- **Sam Rivera:** Requested tea timer synchronization support.

## Related Concepts

- **Parent Election Logging:** Debugging mechanism tracking RSSI and hop count.
- **Rejoin Storm Mitigation:** Network stability feature for meshes with more than 6 nodes.
- **MQTT Export Schema v2:** Updated data format for local broker telemetry exports.
- **[Nova Widget](./nova-widget.md):** Associated product line feature referenced in release metadata.

## Contradictions

&gt; **Contradiction:** There is a discrepancy regarding battery life expectations: engineering estimates 18 months of battery life at 10 nodes, whereas marketing materials continue to advertise a 2-year lifespan. Furthermore, initial kickoff slides incorrectly claimed that the default read interval would be hourly, whereas it officially remains 15 minutes.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `2026-07-02-aurora-meshsync-release-notes.md` | text | Medium |

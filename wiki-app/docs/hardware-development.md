---
id: hardware-development
title: Hardware Development
tags:
  - alex
  - alex-kim
  - aurora
  - aurora-labs
  - auroralabs
  - battery-state-indicator
  - ble-vs-mesh-tradeoffs
  - bridge-financing
last_updated: "2026-09-01T21:23:05.012712+00:00"
sidebar_label: Hardware Development
slug: /hardware-development
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Development

## Overview

[Hardware](./hardware.md) development at [Aurora Labs](./aurora-labs.md) focuses on creating open, local-first [IoT sensors](./iot-sensors.md) for home gardeners and small-acreage farmers under the mission statement: *"Open sensors for people who own their data."* The flagship product, currently named **[Nova Widget](./nova-widget.md)** (designed to feel like garden equipment rather than surveillance gear), utilizes an nRF52840 MCU, capacitive soil moisture sensors, ambient light photodiodes, and air temperature tracking. 

The project emphasizes local data ownership, avoiding subscription-based cloud dashboards in favor of optional CSV exports or [MQTT](./mqtt.md) integration.

## Key Details

### Prototyping and Enclosures
- **Enclosures:** The beta units use 3D-printed PETG (recommended by Jonah Park for beta injection molding if bridge financing is secured). 
- **[Waterproofing](./waterproofing.md):** IP65 tooling has been deferred due to an $8k tool rip cost, resulting in beta units shipping with an **IP54 rating** and clear splash-resistance language. (Competitor [SenseNode SN-400](./sensenode-sn-400.md) maintains an outdoor waterproof advantage with IP67).
- **Power and Battery:** Powered by a CR2032 coin cell battery (resolving earlier blog and teardown typos referencing CR2450). The device features a color-coded LED battery state indicator to show when the device is running low ("I'm dying" battery state).

### Firmware and Connectivity
- **Communication:** [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) is utilized for phone setup, while a custom multi-node mesh protocol codenamed **[MeshSync](./meshsync.md)** handles range extension. MeshSync version 0.3.8 introduced rejoin fixes supporting deployments up to 8 nodes (though 6 nodes are recommended for stability during beta).
- **Readings & Sync:** Nodes experience a 110 µA spike upon rejoining the mesh, which is considered acceptable for the beta phase.

## Related Entities

- **[Mira Chen](./nova-widget.md):** Co-founder handling [firmware](./firmware.md), the [MeshSync protocol](./meshsync-protocol.md), and power profiling.
- **Jonah Park:** Co-founder handling PCBs, sensors, and [mechanical design](./mechanical-design.md).
- **Aurora Labs:** The parent company and project name ("something that sounds like dawn, new beginning").
- **Alex Kim:** Founder of [TeaBuddy](./teabuddy.md), who visited for a lunch-and-learn to discuss local-first IoT, BLE vs. mesh tradeoffs, and zero cloud accounts.

## Related Concepts

- **Local-First IoT:** Devices operating without mandatory cloud infrastructure, supporting [MQTT export](./mqtt-export.md) and optional CSV logging instead.
- **[Mesh Networking](./mesh-networking.md) (MeshSync):** Custom protocol enabling node-to-node communication for extended range in agricultural and garden settings.
- **Bridge Financing:** A targeted $500k raise proposed to fund upcoming injection mold tooling and 2 full-time firmware engineers.

## Contradictions

&gt; **Contradiction:** [Battery life](./battery-life.md) and reading intervals feature conflicting [documentation](./documentation.md) across project records. Initial kickoff notes targeted a 2-year lifespan on a CR2032 battery with **hourly** readings, while later specs and team discussions pointed toward a **15-minute** default interval. A [power budget](./power-budget.md) spreadsheet is planned to resolve these metrics.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |
| 2 | `dummy-test/2026-07-04-investor-update-draft.txt` | text | Unverified |
| 3 | `ideas/backlog-shower-thoughts.txt` | text | Medium |
| 4 | `notes/2026-05-01-kickoff-notes.md` | text | Medium |
| 5 | `notes/2026-06-01-standup-scribbles.txt` | text | Medium |
| 6 | `notes/2026-06-10-fragmented-research.txt` | text | Medium |
| 7 | `notes/TEST-slack-dump.txt` | text | Medium |
| 8 | `samples/notes/[SAMPLE]-2026-07-05-lunch-and-learn-notes.txt` | text | Unverified |
| 9 | `samples/social/[SAMPLE]-2026-07-02-twitter-thread-scrape.txt` | text | Unverified |
| 10 | `transcripts/2026-05-28-weekly-sync.md` | text | Medium |

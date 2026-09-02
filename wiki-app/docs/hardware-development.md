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
last_updated: "2026-09-02T06:39:43.896134+00:00"
sidebar_label: Hardware Development
slug: /hardware-development
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Development

## Overview

[Hardware](./hardware.md) development at [Aurora Labs](./aurora-labs.md) focuses on creating open, local-first [IoT sensors](./iot-sensors.md) for home gardeners and small-acreage farmers under the mission statement: *"Open sensors for people who own their data."* The flagship hardware product, the **[Nova Widget](./nova-widget.md)**, is designed to feel like practical garden equipment rather than surveillance technology. Development emphasizes local-first data ownership—avoiding mandatory cloud accounts in favor of local [MQTT](./mqtt.md) and CSV export options—while balancing stringent power budgets, [mesh networking](./mesh-networking.md), and cost-effective manufacturing choices.

## Key Details

### Product Specifications & Hardware Choices
- **MCU:** nRF52840 microcontroller.
- **Sensors:** Capacitive soil moisture probe, ambient air temperature sensor, and a simple ambient light photodiode.
- **Power System:** Powered by a CR2032 coin cell battery targeting a 2-year lifespan. 
- **Enclosure & Prototyping:** Utilizing 3D-printed PETG for the beta phase, with plans to transition to injection molding (requiring an estimated $8k tooling cost) following successful [fundraising](./fundraising.md).
- **Weatherproofing & Build:** Initial beta units ship with an IP54 rating (using evaluated gasket samples) with clear splash-resistance labeling, deferring more expensive IP65/IP67 tooling due to upfront capital constraints.

### Networking & Firmware
- **Connectivity:** [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) is utilized for initial phone setup, while a custom protocol named **[MeshSync](./meshsync.md)** provides multi-node mesh networking for extended range across garden areas.
- **Mesh Performance:** MeshSync v0.3.8 supports stable 8-node deployments, though node rejoins experience an intermittent power spike of 110 µA.

## Related Entities

- **Aurora Labs:** The parent organization founded by Mira Chen and Jonah Park, operating out of a Portland garage workshop.
- **Mira Chen:** Co-founder responsible for [firmware](./firmware.md) development, the [MeshSync Protocol](./meshsync-protocol.md), power profiling, and data export options.
- **Jonah Park:** Co-founder responsible for PCB design, sensor selection, and mechanical/enclosure engineering.
- **Alex Kim:** Founder of [TeaBuddy](./teabuddy.md), an invited guest and maker community peer who participated in local-first IoT discussions and explored potential cross-marketing or supplier sharing.
- **SenseNode ([SenseNode SN-400](./sensenode-sn-400.md)):** A competing outdoor waterproof sensor benchmark known for its IP67 rating and rugged narrative.

## Related Concepts

- **MeshSync:** A custom multi-node mesh protocol designed for low-power sensor networks (briefly considered for renaming to MeshSink, but rejected).
- **Local-First IoT:** An architectural approach prioritizing direct data ownership, optional MQTT/CSV exports, and zero dependency on mandatory subscription cloud dashboards.
- **BLE vs. Mesh Tradeoffs:** The architectural evaluation of utilizing direct smartphone Bluetooth connectivity versus multi-hop mesh routing for device clusters.

## Contradictions

&gt; **Contradiction:** [Documentation](./documentation.md) and team notes conflict regarding the default sensor reading frequency and [battery life](./battery-life.md) claims, varying between hourly readings versus 15-minute intervals, and 18-month versus 2-year battery lifespan estimates. The team plans to resolve these discrepancies by publishing a comprehensive [power budget](./power-budget.md) spreadsheet.

&gt; **Contradiction:** Early documentation and external teardown references occasionally misidentified the coin cell power source as a CR2450 battery, whereas the official design standard strictly relies on the CR2032 cell.

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

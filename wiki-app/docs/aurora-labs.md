---
id: aurora-labs
title: Aurora Labs
tags:
  - alex
  - aurora-labs
  - backlog-grooming
  - battery-life-claims
  - co-marketing-partnership
  - contradiction-linter
  - documentation-maintenance
  - heuristic-mode
last_updated: "2026-09-02T06:38:32.630915+00:00"
sidebar_label: Aurora Labs
slug: /aurora-labs
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Aurora Labs

## Overview

[Aurora](./aurora-nova-widget-v2.md) Labs is an open-[hardware](./hardware.md) initiative founded by [Mira Chen](./aurora-nova-widget-v2.md) and Jonah Park, operating under the mission statement: *"Open [sensors](./sensors.md) for people who own their data."* Established following a local maker faire in Portland, OR, the company focuses on creating local-first, subscription-free [IoT sensors](./iot-sensors.md) targeted at home gardeners and small-acreage farmers. Their primary product development effort centers around the **[Nova Widget](./nova-widget.md)**, a pebble-shaped sensor designed to monitor soil moisture, air temperature, and ambient light.

## Key Details

### Product Architecture & Specifications
- **Hardware Foundation:** Built around the nRF52840 MCU, featuring capacitive [soil probes](./soil-probes.md), an air temperature sensor, and a simple photodiode for ambient light.
- **Connectivity:** [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) is utilized for initial phone setup, while a custom mesh protocol codenamed **[MeshSync](./meshsync.md)** provides range extension between nodes.
- **Power and Battery Targets:** 
  - Initial kickoff goals aimed for 2 years on a CR2032 battery with hourly readings.
  - Engineering models project 18 months of life at 10 nodes under a 15-minute read interval, while marketing materials may state a 2-year lifespan.
- **[Firmware](./firmware.md) & Releases:** MeshSync firmware version 0.3.8 was released on July 2, 2026, introducing rejoin storm mitigation for meshes exceeding 6 nodes and parent election logging.

### Operations & Team Roles
- **Mira Chen:** Manages firmware development, the [MeshSync Protocol](./meshsync-protocol.md), power profiling, and technical strategy.
- **Jonah Park:** Oversees PCB design, sensor integration, and mechanical/enclosure design (including the pebble-shaped 3D-printed PETG beta enclosures).
- **Project Scope:** v1 explicitly excludes cameras, GPS, and subscription cloud dashboards, relying instead on CSV and local [MQTT](./mqtt.md) exports.

## Related Entities

- **Nova Widget:** The flagship sensor product developed by Aurora Labs.
- **MeshSync:** The custom proprietary [mesh networking](./mesh-networking.md) protocol developed by Mira Chen.
- **[SenseNode](./sensenode-sn-400.md) ([SenseNode SN-400](./sensenode-sn-400.md)):** A competing commercial product line used as a market benchmark.
- **[TeaBuddy](./teabuddy.md):** A smart garden tea project associated with an individual named Alex. While a formal product merge was rejected unanimously, a co-marketing partnership has been discussed.

## Related Concepts

- **Local-First IoT:** A design philosophy emphasizing data ownership, local MQTT/CSV exports, and the avoidance of compulsory cloud subscriptions.
- **Mesh Networking & Rejoin Storms:** The technical challenge of stabilizing larger node clusters (target stability reached at 6 nodes; 8+ nodes remain a field challenge handled via ticketing and version updates).
- **Power Profiling:** Rigorous tracking of sleep regressions, power spikes during node rejoin events, and public [documentation](./documentation.md) via [power budget](./power-budget.md) spreadsheets.

## Contradictions

&gt; **Contradiction:** Kickoff documentation and early specifications originally stated a default read interval of **hourly** with a 2-year CR2032 battery target, but subsequent [firmware releases](./firmware-releases.md) and technical disclosures clarified that the default read interval is **15 minutes**, yielding an engineering expectation of **18 months** at 10 nodes while marketing materials continue to target or claim a 2-year lifespan.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-02-aurora-meshsync-release-notes.md` | text | Unverified |
| 2 | `notes/2026-05-01-kickoff-notes.md` | text | Medium |
| 3 | `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt` | text | Unverified |
| 4 | `samples/notes/[SAMPLE]-2026-07-01-aurora-standup.txt` | text | Unverified |
| 5 | `samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt` | text | Unverified |
| 6 | `samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt` | text | Unverified |

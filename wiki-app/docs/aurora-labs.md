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
last_updated: "2026-09-01T21:21:54.095499+00:00"
sidebar_label: Aurora Labs
slug: /aurora-labs
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Aurora Labs

## Overview
[Aurora](./nova-widget.md) Labs is an open-[hardware](./hardware.md) [IoT](./iot.md) sensor company founded by [Mira Chen](./nova-widget.md) and Jonah Park, who met at a local maker faire. Frustrated by commercial [IoT sensors](./iot-sensors.md) that depend on cloud accounts and have short lifespans, they established Aurora Labs under the mission statement: *"Open sensors for people who own their data."* The company focuses on local, privacy-respecting hardware that exports data via CSV or [MQTT](./mqtt.md) without a mandatory subscription cloud dashboard.

## Key Details
* **Flagship Product:** The **[Nova Widget](./nova-widget.md)**, a pebble-shaped sensor designed primarily for home gardeners and small-acreage farmers.
* **v1 Sensor Scope:** Capacitive soil moisture, air temperature, and an ambient light photodiode. It uses [BLE](./ble.md) for phone setup and a custom mesh protocol for range extension.
* **Non-Goals for v1:** No cameras, no GPS, and no subscription cloud dashboard.
* **Hardware & [Firmware](./firmware.md):** Built using the nRF52840 MCU and a custom mesh protocol codenamed **[MeshSync](./meshsync.md)** (with recurring, rejected internal proposals to rename it "MeshSink"). 
* **Enclosure:** 3D-printed PETG for the beta phase, with injection molding planned later. Beta units feature an IP54 rating, scaling to IP65 once tooling is funded.

## Related Entities
* **Mira Chen:** Co-founder responsible for firmware, the [MeshSync protocol](./meshsync-protocol.md), and power profiling.
* **Jonah Park:** Co-founder responsible for PCBs, sensors, and [mechanical design](./mechanical-design.md).
* **Alex:** Friend and creator of [TeaBuddy](./teabuddy.md), who sent a joke gift (pebble-shaped stress ball) and is associated with a co-marketing partnership discussion.
* **[SenseNode SN-400](./sensenode-sn-400.md):** Competitor providing alternative sensor products (such as the [SenseNode SN-400](./sensenode-sn-400.md)).

## Related Concepts
* **MeshSync:** Custom mesh protocol designed to extend range. Version 0.3.8 introduced rejoin storm mitigation for meshes exceeding 6 nodes, parent election logging via debug UART, and reduced power spikes on rejoin (340µA to 180µA).
* **Power Profiling & [Battery Life](./battery-life.md):** Original kickoff goals targeted 2 years on a CR2032 battery with hourly readings. Engineering estimates place actual battery life at 18 months at 10 nodes with 15-minute reads, while marketing traditionally rounds claims up to 2 years.
* **TeaBuddy:** A smart garden tea project led by Alex. While initially considered out of scope for Aurora v1, discussions have involved potential co-marketing [partnerships](./partnerships.md), though formal software merging or deep integration has been rejected.

## Contradictions
&gt; **Contradiction:** Read interval timing varies across project artifacts. Initial kickoff notes and [documentation](./documentation.md) drafts specified an hourly default reading interval, but the v1 specification and MeshSync [firmware releases](./firmware-releases.md) (such as 0.3.8) strictly enforce a default read interval of 15 minutes.

&gt; **Contradiction:** Battery life and read frequency specifications conflict between engineering realities, marketing materials, and legacy documentation. While kickoff documentation targeted 2 years on a CR2032 battery with hourly readings, engineering data establishes an 18-month life at 10 nodes with 15-minute readings, and separate blog typos have referenced alternate battery types like the CR2450.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-02-aurora-meshsync-release-notes.md` | text | Unverified |
| 2 | `notes/2026-05-01-kickoff-notes.md` | text | Medium |
| 3 | `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt` | text | Unverified |
| 4 | `samples/notes/[SAMPLE]-2026-07-01-aurora-standup.txt` | text | Unverified |
| 5 | `samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt` | text | Unverified |
| 6 | `samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt` | text | Unverified |

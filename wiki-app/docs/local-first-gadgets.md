---
id: local-first-gadgets
title: Local-First Gadgets
tags:
  - alex-kim
  - aurora-labs
  - battery-duty-cycles
  - local-first-architecture
  - local-first-gadgets
  - mesh-networking-vs-ble
  - mira-chen
  - sensenode
last_updated: "2026-09-10T14:38:59.355709+00:00"
sidebar_label: Local-First Gadgets
slug: /local-first-gadgets
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Local-First Gadgets

## Overview
This wiki page outlines the planned (though ultimately unrecorded) 2026-07-11 podcast episode titled "[Local-first](./local-first.md) gadgets," hosted by Alex Kim from [TeaBuddy](./teabuddy.md) and [Mira Chen](./aurora-nova-widget-v2.md) from [Aurora Labs](./aurora-labs.md). The discussion centers around the philosophy, architecture, and practical considerations of building [hardware devices](./hardware-devices.md) that prioritize local processing and connectivity over mandatory cloud integration.

## Key Details
* **Cloud-Free Architecture (v1):** 
  * TeaBuddy evaluates steep timer privacy, contrasting "privacy theater" with genuine functional needs.
  * Aurora Labs emphasizes a mesh-first approach where data stays strictly on the local area network (LAN).
* **Battery Performance & Duty Cycles:** 
  * Both products utilize CR2032 coin cell batteries, but they experience significantly different duty cycles.
* **Connectivity Trade-offs (Mesh vs. [BLE](./ble.md)):** 
  * [Mesh networking](./mesh-networking.md) excels at garden scale with multiple deployed [sensors](./sensors.md).
  * [Bluetooth Low Energy](./bluetooth-low-energy.md) (BLE) wins out for single-device kitchen environments.
* **The [SenseNode](./sensenode.md) Factor:** 
  * Addressed as the "elephant in the room," touching upon subscription fatigue and hardware features like IP67 ratings ("IP67 envy").

## Related Entities
* **Alex Kim:** Host representing TeaBuddy.
* **Mira Chen:** Host representing Aurora Labs.
* **TeaBuddy:** A hardware product featuring a steep timer, represented by Alex Kim.
* **Aurora Labs:** A company focusing on LAN-bound mesh data, represented by Mira Chen.
* **SenseNode:** A competing or reference device noted for its subscriptions and IP67 rating.

## Related Concepts
* **Local-First Architecture:** Designing software and hardware systems that function independently of cloud infrastructure.
* **Mesh Networking vs. BLE:** Evaluating communication [protocols](./protocols.md) based on physical scale and node density (garden scale versus single kitchen appliances).
* **Battery Duty Cycles:** [Power consumption](./power-consumption.md) management in compact coin-cell-powered devices.
* **Subscription Fatigue:** Consumer frustration with ongoing recurring costs for smart hardware features.

## Contradictions
* **Battery Lifespan Claims:** There is a discrepancy between [marketing](./marketing.md) claims and realistic expectations regarding battery longevity.
  &gt; **Contradiction:** Conflicting marketing estimates of 2-year versus 18-month battery lifespans for devices using CR2032 batteries.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/transcripts/[SAMPLE]-2026-07-11-podcast-outline-unrecorded.txt` | text | Unverified |

---
id: iot
title: IoT
tags:
  - alex-kim
  - aurora
  - ble-vs-mesh-tradeoffs
  - iot
  - ip67-rating
  - jonah
  - lan-first-architecture
  - local-first-iot
last_updated: "2026-09-01T19:19:35.612296+00:00"
sidebar_label: IoT
slug: /iot
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# IoT

## Overview
Internet of Things (IoT) architecture increasingly emphasizes local-first designs, reliability, and reduced cloud dependency. Discussions around modern IoT deployment center on [hardware](./hardware.md) efficiency, communication [protocols](./protocols.md) (such as [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) versus mesh networks), and environmental durability ratings like IP67.

## Key Details
- **[Nova Widget](./nova-widget.md) Beta:** A local mesh soil sensor project featuring MeshSync, optional [MQTT](./mqtt.md), and no mandatory cloud connectivity. It runs on a CR2032 battery with 15-minute read intervals, utilizing a LAN-first architecture to maintain a lower duty cycle compared to continuous Wi-Fi connection.
- **Hardware & Enclosures:** Debates in the community highlight the preference for higher environmental protection standards, such as IP67 over IP54, particularly for submersion use cases.
- **Protocol Tradeoffs:** BLE and mesh networks each present distinct performance and [power consumption](./power-consumption.md) tradeoffs for consumer hardware. Mesh complexity is noted to become worthwhile when scaling to six or more garden [sensors](./sensors.md).
- **Cloud Independence:** Projects like [TeaBuddy](./teabuddy.md) and Nova Widget deliberately reject mandatory cloud accounts for their initial versions, aligning with local-first operational principles.

## Related Entities
- **Alex Kim:** TeaBuddy presenter and invited guest at the [Aurora Labs](./aurora-labs.md) office.
- **[Mira](./aurora-labs.md) ([mirachen](./aurora-labs.md)):** Creator of the Nova Widget beta, who noted that mesh complexity is worth it at scale (6+ garden sensors).
- **Jonah:** Aurora team member who offered to share enclosure supplier contacts.
- **TeaBuddy:** Consumer gadget team focused on single-purpose devices ("one device, one job") without v1 cloud accounts.
- **Aurora:** Organization hosting lunch-and-learn sessions.

## Related Concepts
- **Local-first IoT:** System design prioritizing local device communication, LAN-first architectures, and optional cloud bridging (e.g., via MQTT).
- **BLE vs Mesh Tradeoffs:** Balancing power, range, and network density for low-power consumer devices and environmental sensors.
- **Duty Cycle Optimization:** Minimizing radio active time to extend coin-cell [battery life](./battery-life.md) (such as CR2032 cells operating on 15-minute intervals).

## Contradictions
&gt; **Contradiction:** Debate exists over network communication standards—specifically whether to rely on simpler Wi-Fi architectures versus optimized mesh topologies and local-first LAN structures for remote or low-power sensor deployment. Furthermore, community opinions differ on environmental enclosure standards, such as whether IP67 is necessary over IP54 for standard garden deployments.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt` | text | Unverified |
| 2 | `samples/notes/[SAMPLE]-2026-07-05-lunch-and-learn-notes.txt` | text | Unverified |

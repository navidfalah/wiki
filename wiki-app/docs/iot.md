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
last_updated: "2026-09-10T14:38:52.597156+00:00"
sidebar_label: IoT
slug: /iot
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# IoT

## Overview
Internet of Things ([IoT](./iot.md)) architecture increasingly emphasizes [local-first](./local-first.md) designs, LAN-first connectivity, and the avoidance of mandatory cloud dependencies. Recent developments highlight [hardware](./hardware.md) innovations such as mesh soil [sensors](./sensors.md), battery efficiency considerations, and design tradeoffs between local mesh networks and standard Wi-Fi or [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)).

## Key Details
- **[Nova Widget](./nova-widget.md) Beta:** A mesh soil sensor project featuring [MeshSync](./meshsync.md), optional [MQTT](./mqtt.md) support, and no mandatory cloud connection. It operates on CR2032 batteries with 15-minute read intervals.
- **LAN-First Architecture:** Prefers local network communication and lower duty cycles over constant [Wi-Fi connectivity](./wi-fi-connectivity.md) to save power and enhance privacy.
- **[Hardware Specifications](./hardware-specifications.md):** Discussions around environmental durability highlight a preference for IP67 ratings over IP54, particularly for submersion use cases.
- **[TeaBuddy](./teabuddy.md) & Local-First Philosophy:** TeaBuddy products focus on single-purpose consumer utility ("one device one job") and reject cloud accounts for their initial versions.

## Related Entities
- **Alex Kim:** Invited guest presenter from TeaBuddy at the [Aurora](./aurora-nova-widget-v2.md) office lunch-and-learn session.
- **Aurora:** Host organization for the local-first IoT lunch-and-learn session.
- **[Mira](./aurora-nova-widget-v2.md) ([mirachen](./aurora-nova-widget-v2.md)):** Creator/OP of the Nova Widget beta project who noted that mesh complexity is worthwhile when scaling to six or more garden sensors.
- **Jonah:** Aurora team member who offered to share enclosure supplier contacts.

## Related Concepts
- **BLE vs. Mesh Tradeoffs:** Evaluating range, [power consumption](./power-consumption.md), and device density for consumer gadgets.
- **Local-First IoT:** Designing hardware and software that functions independently of cloud infrastructure, utilizing LAN-first and optional MQTT [protocols](./protocols.md).

## Contradictions
&gt; **Contradiction:** Debate exists over the necessity of [mesh networking](./mesh-networking.md) versus standard Wi-Fi for garden and household sensors. While proponents of local-first designs argue for LAN-first architectures and lower duty cycles using mesh or local protocols, critics question the added complexity compared to standard Wi-Fi solutions. Additionally, robust enclosures spark debates regarding whether IP67 is universally necessary over IP54 outside of direct submersion use cases.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt` | text | Unverified |
| 2 | `samples/notes/[SAMPLE]-2026-07-05-lunch-and-learn-notes.txt` | text | Unverified |

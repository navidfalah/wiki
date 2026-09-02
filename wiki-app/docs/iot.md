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
last_updated: "2026-09-02T06:40:24.814836+00:00"
sidebar_label: IoT
slug: /iot
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# IoT

## Overview
Internet of Things (IoT) architecture, [hardware](./hardware.md) trade-offs, and local-first deployment strategies have seen significant discussion across developer communities and engineering teams. Projects like the [Nova Widget](./nova-widget.md) and [TeaBuddy](./teabuddy.md) highlight a growing industry shift toward LAN-first architectures, local [mesh networking](./mesh-networking.md), and the elimination of mandatory cloud accounts.

## Key Details
- **Nova Widget Beta:** Features [MeshSync](./meshsync.md), optional [MQTT](./mqtt.md) capabilities, and no mandatory cloud dependency. It runs on a CR2032 coin cell battery with 15-minute read intervals.
- **Architecture & Connectivity:** Proponents of local-first IoT favor LAN-first designs and low duty cycles over standard Wi-Fi configurations to optimize power and privacy.
- **Hardware & Enclosures:** Debates around durability include discussions on IP67 versus IP54 ingress protection ratings, where IP67 is recognized as superior for submersion use cases.
- **Mesh vs. [BLE](./ble.md):** Mesh networking complexity is generally considered worthwhile when deploying six or more garden [sensors](./sensors.md), whereas consumer gadgets like tea-monitoring devices often focus on single-purpose functionality.

## Related Entities
- **Alex Kim:** Invited guest presenter from TeaBuddy at the [Aurora](./aurora-nova-widget-v2.md) office lunch-and-learn session.
- **Aurora:** Host organization for the local-first IoT lunch-and-learn event.
- **Jonah:** Attendee at the Aurora lunch-and-learn who offered to share enclosure supplier contacts.
- **[Mira](./aurora-nova-widget-v2.md) ([mirachen](./aurora-nova-widget-v2.md)):** Creator/OP of the Nova Widget beta project.
- **TeaBuddy:** Consumer gadget company whose team are friends of the Nova Widget creators.

## Related Concepts
- **LAN-First Architecture:** Designing [IoT Systems](./iot-systems.md) to operate primarily on local area networks, reducing cloud dependency and improving response times.
- **BLE vs. Mesh Tradeoffs:** Balancing the power efficiency and direct pairing of [Bluetooth Low Energy](./bluetooth-low-energy.md) against the extended coverage and routing complexity of mesh networks.
- **Local-First IoT:** A design philosophy emphasizing local control, offline availability, and user [Data Privacy](./data-privacy.md) without mandatory cloud dependencies.

## Contradictions
&gt; **Contradiction:** Community discussions reflect differing viewpoints on hardware durability standards, specifically the debate between `IP67 > IP54 fight me` versus practical application requirements for submersion use cases.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt` | text | Unverified |
| 2 | `samples/notes/[SAMPLE]-2026-07-05-lunch-and-learn-notes.txt` | text | Unverified |

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
last_updated: "2026-09-01T21:23:43.937303+00:00"
sidebar_label: IoT
slug: /iot
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# IoT

## Overview
Internet of Things (IoT) architecture increasingly focuses on local-first designs, reducing cloud dependency, and evaluating [hardware](./hardware.md) tradeoffs such as [BLE](./ble.md) versus [mesh networking](./mesh-networking.md), [battery life](./battery-life.md) optimization, and environmental ratings. Recent developments highlight community discussions around products like the [Nova Widget](./nova-widget.md) and [TeaBuddy](./teabuddy.md), emphasizing LAN-first architectures and minimal cloud requirements.

## Key Details
- **Nova Widget Beta:** Features [MeshSync](./meshsync.md), optional [MQTT](./mqtt.md), and no mandatory cloud connection. It uses CR2032 coin cell batteries with 15-minute read intervals.
- **LAN-First Architecture:** Prefers local network operation and lower duty cycles over constant [Wi-Fi connectivity](./wi-fi-connectivity.md) to preserve power and user privacy.
- **Environmental Durability:** Debates persist regarding enclosure ratings, specifically whether IP67 ratings are strictly necessary compared to IP54 for non-submersion use cases.
- **Local-First Consumer Gadgets:** Projects like TeaBuddy reject mandatory cloud accounts for version 1, focusing on single-purpose simplicity ("one device, one job").
- **Networking Tradeoffs:** BLE versus mesh network tradeoffs dictate consumer gadget design, with mesh complexity becoming worthwhile at scales of 6 or more garden [sensors](./sensors.md).

## Related Entities
- **Alex Kim:** Presenter at the Aurora office lunch-and-learn and representative of TeaBuddy.
- **Mira Chen (mirachen):** Creator/OP of the Nova Widget beta ("[Show HN](./show-hn.md): Local mesh soil sensor").
- **Jonah:** Aurora team member who offered to share enclosure supplier contacts.
- **Aurora:** Office and host of the local-first IoT lunch-and-learn session.
- **TeaBuddy:** Consumer gadget company and maker of tea-brewing devices (distinct from, but friendly with, the Nova Widget team).

## Related Concepts
- **LAN-First Architecture:** Designing [smart devices](./smart-devices.md) to communicate primarily over local networks rather than routing traffic through external cloud servers.
- **Mesh Networking vs. BLE:** Evaluating communication [protocols](./protocols.md) for reliability, range, and battery consumption in distributed smart hardware.
- **Cloud-Free IoT:** Eliminating mandatory user accounts and cloud backends to enhance privacy and ensure longevity if manufacturer servers shut down.

## Contradictions
&gt; **Contradiction:** There is an open question regarding duplicate discussions, as moderator `@dang` noted that the Hacker News thread for the local mesh soil sensor might be a duplicate of a thread from May.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt` | text | Unverified |
| 2 | `samples/notes/[SAMPLE]-2026-07-05-lunch-and-learn-notes.txt` | text | Unverified |

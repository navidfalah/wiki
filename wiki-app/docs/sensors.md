---
id: sensors
title: Sensors
tags:
  - ip67-rating
  - lan-first-architecture
  - meshsync
  - mirachen
  - nova-widget
  - sensors
  - wiki
last_updated: "2026-09-01T19:21:27.146848+00:00"
sidebar_label: Sensors
slug: /sensors
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Sensors

## Overview
The discussion around modern local sensor development highlights the **[Nova Widget](./nova-widget.md)** beta, a local mesh soil sensor presented by creator **[mirachen](./aurora-labs.md)** on Hacker News in July 2026. The project emphasizes local-first communication [protocols](./protocols.md), avoiding mandatory cloud dependencies in favor of a LAN-first architecture with MeshSync and optional [MQTT](./mqtt.md) support.

## Key Details
- **[Hardware](./hardware.md) & Power:** Powered by a CR2032 coin cell battery executing 15-minute read intervals. Battery math details are planned for release via spreadsheet by the creator.
- **Architecture & Connectivity:** Designed with a LAN-first approach and lower duty cycles rather than relying solely on Wi-Fi, which reduces power overhead and maintains local control via MeshSync and optional MQTT.
- **Durability:** Features robust environmental ratings, sparking discussions within the community regarding the superiority of IP67 over IP54 ratings, particularly for submersion use cases.
- **Ecosystem Connections:** The team behind the Nova Widget is separate from, though friendly with, the creators of "[teabuddy](./teabuddy.md)" seen at a recent faire.

## Related Entities
- **mirachen:** Original poster (OP) and creator of the Nova Widget beta.
- **Nova Widget:** The local mesh soil sensor project in beta.

## Related Concepts
- **LAN-First Architecture:** Network design prioritizing local network communication over cloud-dependent setups.
- **MeshSync:** The synchronization protocol used within the mesh sensor network.
- **IP67 Rating:** Enclosure rating discussed for its suitability in submersion scenarios compared to lower standards like IP54.

## Contradictions
*No contradictions were identified in the provided sources regarding this topic.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt` | text | Unverified |

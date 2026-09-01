---
id: hardware
title: Hardware
tags:
  - hardware
  - ip67-rating
  - lan-first-architecture
  - meshsync
  - mirachen
  - nova-widget
  - wiki
last_updated: "2026-09-01T21:23:24.109133+00:00"
sidebar_label: Hardware
slug: /hardware
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware

## Overview
The hardware discussion centers around the [Nova Widget](./nova-widget.md) beta, a local mesh soil sensor introduced by user `mirachen` in a July 2026 Hacker News thread. The device emphasizes local connectivity, energy efficiency, and durability over traditional cloud-reliant setups.

## Key Details
- **Device:** Nova Widget beta (local mesh soil sensor).
- **Power Source:** Powered by a CR2032 coin cell battery, performing reads every 15 minutes. 
- **Architecture & Connectivity:** Designed with a LAN-first architecture and [MeshSync](./meshsync.md) capabilities, featuring optional [MQTT](./mqtt.md) support and no mandatory cloud connection. 
- **Enclosure & Durability:** Features an IP67 rating, which provides superior protection against dust and water immersion compared to standard IP54 ratings.
- **Design Philosophy:** Prioritizes a lower duty cycle and local-first data transmission instead of relying strictly on continuous Wi-Fi connections.

## Related Entities
- **[mirachen](./nova-widget.md):** The original poster (OP) and creator of the Nova Widget beta.
- **Nova Widget:** The specific hardware product discussed in the thread.
- **[teabuddy](./teabuddy.md):** A related hardware project created by friends of the OP, though developed by a separate company.

## Related Concepts
- **LAN-First Architecture:** A network design choice that keeps data transmission local to the user's network before considering external or cloud services.
- **MeshSync:** A synchronization protocol utilized for mesh-connected hardware nodes.
- **IP67 Rating:** An ingress protection standard indicating complete protection against dust and capability to withstand water immersion up to 1 meter.

## Contradictions
*(No direct contradictions were present in the provided source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt` | text | Unverified |

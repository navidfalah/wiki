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
last_updated: "2026-09-01T21:25:32.066996+00:00"
sidebar_label: Sensors
slug: /sensors
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Sensors

## Overview
The "Sensors" topic covers the discussion surrounding the [Nova Widget](./nova-widget.md) beta, a local mesh soil sensor showcased on Hacker News in July 2026. Developed by user `mirachen`, the project emphasizes local-first connectivity, featuring [MeshSync](./meshsync.md), optional [MQTT](./mqtt.md) protocol support, and a strict no-mandatory-cloud design philosophy.

## Key Details
- **Product:** Nova Widget beta (Local mesh soil sensor)
- **Creator / OP:** `mirachen`
- **Connectivity:** LAN-first architecture with lower duty cycle and optional MQTT; avoids mandatory cloud dependencies and Wi-Fi-only approaches to optimize power and local reliability.
- **[Power Management](./power-management.md):** Powered by a CR2032 battery taking 15-minute interval reads (battery math spreadsheet promised by the OP).
- **Build & Durability:** Community and developer debate highlight ruggedness specifications, specifically comparing IP67 versus IP54 ratings, with the creator conceding that IP67 is appropriate for submersion use cases.

## Related Entities
- **[mirachen](./nova-widget.md):** OP and creator of the Nova Widget beta project.
- **[Teabuddy](./teabuddy.md):** A separate product/team seen at a faire, distinct from the Nova Widget creators.

## Related Concepts
- **MeshSync:** The underlying mesh synchronization protocol used by the Nova Widget.
- **LAN-First Architecture:** A design approach prioritizing local network communication over cloud-dependent setups.
- **IP67 Rating:** Enclosure rating standard discussed for [hardware](./hardware.md) water and dust resistance, contrasted against IP54.

## Contradictions
*There are no direct contradictions present in the source material, though minor clarifications were made regarding team independence from "Teabuddy" and the suitability of IP67 over IP54 ratings.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt` | text | Unverified |

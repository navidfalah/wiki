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
last_updated: "2026-09-02T06:40:04.081347+00:00"
sidebar_label: Hardware
slug: /hardware
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware

## Overview
The "Hardware" topic covers the physical specifications, [networking](./networking.md) architecture, [power management](./power-management.md), and durability design principles associated with the [Nova Widget](./nova-widget.md) beta local mesh soil sensor, as discussed in a Hacker News thread by OP `mirachen`.

## Key Details
- **Device & Purpose:** Nova Widget beta, a local mesh soil sensor featuring optional [MQTT](./mqtt.md) and no mandatory cloud dependencies.
- **Power & Battery:** Powered by a CR2032 coin cell battery taking reads every 15 minutes (with battery math spreadsheets forthcoming).
- **Networking Architecture:** LAN-first architecture utilizing [MeshSync](./meshsync.md) with a lower duty cycle, chosen over standard Wi-Fi for improved efficiency and local control.
- **Durability Ratings:** Features an IP67 rating, which is debated against IP54 alternatives, though acknowledged as fair for submersion use cases.

## Related Entities
- **[mirachen](./aurora-nova-widget-v2.md):** Original Poster (OP) and creator of the Nova Widget beta.
- **Nova Widget:** The local mesh soil sensor product being developed and beta-tested.
- **MeshSync:** The synchronization protocol used by the device's [mesh networking](./mesh-networking.md) system.
- **[teabuddy](./teabuddy.md):** A related hardware product seen at a faire by the same friend group, though developed by a separate company.

## Related Concepts
- **LAN-First Architecture:** A design approach prioritizing local network communication over mandatory cloud connectivity to decrease duty cycles and ensure privacy.
- **IP67 Rating:** An ingress protection standard providing complete protection against dust and water immersion up to 1 meter.

## Contradictions
*(None noted in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt` | text | Unverified |

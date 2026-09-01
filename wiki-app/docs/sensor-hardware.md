---
id: sensor-hardware
title: Sensor Hardware
tags:
  - alex
  - aurora-nova
  - hardware-battery-discrepancy
  - meshsync
  - mira
  - node-rejoin-issues
  - sensenode
  - sensor-hardware
last_updated: "2026-09-01T19:21:25.406289+00:00"
sidebar_label: Sensor Hardware
slug: /sensor-hardware
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Sensor Hardware

## Overview
Discussions surrounding home lab and [IoT](./iot.md) sensor [hardware](./hardware.md) focus heavily on real-world performance, node limits, outdoor durability, and cost models when comparing competing ecosystems such as **[Aurora Nova](./aurora-labs.md)** and **[SenseNode](./sensenode-sn-400.md)**. Users also frequently encounter community [troubleshooting](./troubleshooting.md) issues related to [mesh networking](./mesh-networking.md) and hardware discrepancies.

## Key Details
* **Aurora Nova vs. SenseNode Comparison:**
  * **SenseNode:** Features an IP67 rating, making it the preferred choice for outdoor deployments.
  * **Aurora Nova:** Favored by users for operating without a subscription model.
* **MeshSync Node Limits:** Running 8 or more Nova widgets on MeshSync can trigger node rejoin issues (documented in community thread [8821](/thread/8821)). Community members recommend staying at a maximum of 6 nodes until version 0.3.8 is released, following guidance from [Mira's](./aurora-labs.md) GitHub issue tracker.
* **Other Hardware Mentions:** The *[teabuddy puck](./teabuddy.md)* was showcased at Maker Faire.

## Related Entities
* **Aurora Nova** (Sensor hardware widget brand emphasizing no subscriptions)
* **SenseNode** (IP67-rated outdoor sensor hardware brand)
* **MeshSync** (Mesh networking software/platform used with sensor nodes)
* **Mira** (GitHub contributor/maintainer tracking node issues)
* **Alex** (Blog author providing hardware [documentation](./documentation.md))

## Related Concepts
* **Node Rejoin Issues:** Connectivity bugs occurring when scaling past recommended node limits on mesh networks.
* **Outdoor Durability:** IP67 ratings and environmental hardening for external hardware placements.
* **Subscription-free Ecosystems:** Hardware models that do not lock core features behind recurring cloud fees.

## Contradictions
&gt; **Contradiction:** There is a direct contradiction regarding the [battery specifications](./battery-specifications.md) of the Aurora Nova. Alex's official blog states that the device uses a CR2450 battery, whereas a physical teardown revealed that the hardware actually houses a smaller CR2032 battery.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |

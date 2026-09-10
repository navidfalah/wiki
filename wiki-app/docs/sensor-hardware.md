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
last_updated: "2026-09-10T14:40:34.024990+00:00"
sidebar_label: Sensor Hardware
slug: /sensor-hardware
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Sensor Hardware

## Overview
Discussions surrounding home lab and [IoT](./iot.md) sensor [hardware](./hardware.md) focus heavily on real-world performance comparisons between popular models such as the [Aurora Nova Widget v2](./aurora-nova-widget-v2.md) and [SenseNode](./sensenode.md), particularly regarding network stability under load, environmental durability, and [hardware specifications](./hardware-specifications.md).

## Key Details
- **Aurora Nova vs. SenseNode:** 
  - SenseNode is praised for its IP67 rating, making it superior for outdoor use.
  - Aurora Nova is favored for its lack of a required subscription.
- **[MeshSync](./meshsync.md) Scalability & Rejoin Issues:** 
  - Running 8 or more Aurora Nova widgets on MeshSync can trigger node rejoin issues (noted as aligning with thread 8821).
  - Users are advised by community members (referencing [Mira's](./aurora-nova-widget-v2.md) GitHub issues) to cap deployments at 6 nodes until [firmware](./firmware.md) version 0.3.8 is released.

## Related Entities
- **Aurora Nova:** Sensor widget evaluated for subscription-free usage and MeshSync compatibility.
- **SenseNode:** Outdoor-rated sensor featuring an IP67 enclosure.
- **MeshSync:** Platform or protocol used for managing sensor node connections.
- **Mira:** Contributor or developer tracking issues on GitHub regarding node limits.
- **Alex:** Blog author who published technical details regarding sensor specifications.

## Related Concepts
- **Node Rejoin Issues:** Connectivity challenges experienced when scaling past certain thresholds on mesh networks.
- **Hardware Specifications:** Physical build details, such as battery types and environmental enclosures (IP67).

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the battery type used in the Aurora [Nova Hardware](./nova-hardware.md). While Alex's blog states the device utilizes a CR2450 battery, physical teardowns of the hardware reveal that it actually houses a smaller CR2032 battery.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |

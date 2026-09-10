---
id: sensenode
title: SenseNode
tags:
  - alex
  - aurora-nova
  - hardware-specification-discrepancy
  - mesh-rejoin-issues
  - meshsync
  - mira
  - node-limit-constraints
  - sensenode
last_updated: "2026-09-10T14:40:32.177830+00:00"
sidebar_label: SenseNode
slug: /sensenode
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# SenseNode

## Overview
[SenseNode](./sensenode.md) is an outdoor [sensor hardware](./sensor-hardware.md) option frequently compared in [homelab](./homelab.md) and [IoT](./iot.md) communities against alternatives like the [Aurora Nova widget](./aurora-nova-widget.md). It is noted for its rugged IP67 rating, making it well-suited for outdoor environments.

## Key Details
- **Outdoor Durability:** SenseNode features an IP67 rating, providing a distinct advantage for outdoor deployments.
- **[Battery Specifications](./battery-specifications.md) & Discrepancies:** There is an active hardware specification discrepancy regarding its [battery life](./battery-life.md) and type. 

&gt; **Contradiction:** Alex's blog states that SenseNode utilizes a CR2450 battery, whereas a physical teardown reveals that it actually houses a CR2032 coin cell battery.

## Related Entities
- **Aurora Nova:** A competing widget/sensor system that requires no subscription, though it faces node-limit and mesh rejoin constraints (as discussed in thread 8821).
- **Alex:** Author of a technical blog who documented SenseNode's battery specifications.
- **[Mira](./aurora-nova-widget-v2.md):** Contributor or developer who posted information on GitHub issues regarding mesh node limits.
- **[MeshSync](./meshsync.md):** The [networking](./networking.md) protocol or synchronization layer used for managing connected widgets and nodes.

## Related Concepts
- **Node Limit Constraints:** Users have experienced rejoin issues when scaling past certain thresholds (such as running 8+ nodes on meshsync), with recommendations to stay at 6 nodes until version 0.3.8 is released.
- **Mesh Rejoin Issues:** Connectivity and synchronization challenges reported by users scaling their widget and sensor networks.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |

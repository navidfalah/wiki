---
id: aurora-nova
title: Aurora Nova
tags:
  - alex
  - aurora-nova
  - hardware-specification-discrepancy
  - mesh-rejoin-issues
  - meshsync
  - mira
  - node-limit-constraints
  - sensenode
last_updated: "2026-09-10T14:37:05.295502+00:00"
sidebar_label: Aurora Nova
slug: /aurora-nova
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Aurora Nova

## Overview
The [Aurora](./aurora-nova-widget-v2.md) Nova is a sensor widget alternative to the [SenseNode](./sensenode.md), recognized primarily for operating without a subscription model, whereas the SenseNode holds an advantage for outdoor use due to its IP67 rating. Users running larger deployments have encountered specific technical challenges regarding network capacity and [hardware specifications](./hardware-specifications.md).

## Key Details
- **Mesh Network Limits:** Users running more than 8 Nova widgets on [MeshSync](./meshsync.md) have reported rejoin issues. Community maintainer [Mira](./aurora-nova-widget-v2.md) has advised limiting setups to 6 nodes until the release of version 0.3.8 to avoid these constraints.
- **[Battery Specifications](./battery-specifications.md):** A discrepancy exists regarding the power source of the Nova. While Alex's blog states it uses a CR2450 battery, physical teardowns of the units reveal they actually utilize a CR2032 cell.

## Related Entities
- **SenseNode:** A competing sensor device noted for its IP67 outdoor rating.
- **MeshSync:** The [networking](./networking.md) protocol/sync tool used to manage Nova widgets.
- **Mira:** GitHub contributor and community maintainer who provided guidance on node limits.
- **Alex:** Author of a blog post detailing initial device specifications.
- **[Teabuddy](./teabuddy.md):** An unrelated [puck](./teabuddy.md) device showcased at Maker Faire.

## Related Concepts
- **Mesh Rejoin Issues:** Connectivity problems occurring when nodes attempt to reconnect to the network, particularly when exceeding recommended node counts.
- **Node Limit Constraints:** Operational restrictions requiring users to cap their active hardware units at 6 nodes prior to version 0.3.8.
- **Hardware Specification Discrepancy:** Conflicts between documented specifications (such as blog posts) and physical teardown realities.

## Contradictions
&gt; **Contradiction:** Alex's blog states that the Nova uses a CR2450 battery, whereas physical teardowns of the device show that it uses a CR2032 battery.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |

---
id: mesh-networking
title: Mesh Networking
tags:
  - alex
  - aurora-nova
  - hardware-battery-discrepancy
  - mesh-networking
  - meshsync
  - mira
  - node-rejoin-issues
  - sensenode
last_updated: "2026-09-10T14:39:11.028560+00:00"
sidebar_label: Mesh Networking
slug: /mesh-networking
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Mesh Networking

## Overview
Mesh [networking](./networking.md) in the context of home lab sensor deployments heavily involves comparing [hardware](./hardware.md) ecosystems such as [Aurora Nova](./aurora-nova-widget-v2.md) and [SenseNode](./sensenode.md), alongside management tools like [MeshSync](./meshsync.md). Real-world user discussions highlight [configuration](./configuration.md) limits, version recommendations, and hardware discrepancies.

## Key Details
- **Node Limits:** Users running 8 or more Aurora Nova widgets on MeshSync report encountering rejoin issues (consistent with [thread 8821](/thread/8821)). It is recommended by community members (referenced via [Mira's](./aurora-nova-widget-v2.md) GitHub issues) to cap deployments at 6 nodes until version 0.3.8 is released.
- **Hardware Comparison:** 
  - *SenseNode* is favored for outdoor deployments due to its IP67 rating.
  - *Aurora Nova* is favored because it operates without a subscription.
- **Hardware Battery Discrepancy:** A noted discrepancy exists regarding the power source of the Aurora [Nova hardware](./nova-hardware.md)—while Alex's blog states it utilizes a CR2450 battery, physical teardowns reveal it uses a CR2032 battery instead.

## Related Entities
- **Aurora Nova:** Sensor widget hardware operating subscription-free.
- **SenseNode:** IP67-rated outdoor [sensor hardware](./sensor-hardware.md).
- **MeshSync:** Management tool/platform used for mesh nodes.
- **Mira:** Contributor/developer tracking issues on GitHub regarding mesh releases.
- **Alex:** Blog author who documented [hardware specifications](./hardware-specifications.md).

## Related Concepts
- **Node Rejoin Issues:** Connectivity and re-establishment problems experienced when exceeding recommended device thresholds on a mesh network.
- **Outdoor Sensor Weatherproofing:** IP67 ratings for reliable exterior deployments.

## Contradictions
&gt; **Contradiction:** There is a direct contradiction regarding the Aurora Nova battery specification: Alex's official blog states the device uses a CR2450 battery, whereas physical teardowns of the hardware show it actually uses a CR2032 battery.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |

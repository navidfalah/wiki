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
last_updated: "2026-09-01T19:19:55.185061+00:00"
sidebar_label: Mesh Networking
slug: /mesh-networking
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Mesh Networking

## Overview
Discussions surrounding real-world deployments of home lab [sensors](./sensors.md) and mesh [networking](./networking.md) configurations frequently compare [hardware](./hardware.md) options such as the [Aurora Nova](./aurora-labs.md) and [SenseNode](./sensenode-sn-400.md). Users have reported specific challenges regarding node limits and rejoin behavior when running multiple widgets on MeshSync, prompting guidance from developers and the community.

## Key Details
- **Node Scaling Limitations:** Users running 8 or more Aurora Nova widgets on MeshSync have encountered node rejoin issues, aligning with previous community reports (e.g., thread 8821).
- **Developer Recommendations:** Community member `meshfan` noted that developer `mira` posted on GitHub issues advising users to stay at a maximum of 6 nodes until version `0.3.8` is released.
- **Hardware Comparison:** 
  - **SenseNode:** Favored for outdoor use due to its IP67 rating.
  - **Aurora Nova:** Favored because it requires no subscription.

## Related Entities
- **Aurora Nova:** Sensor widget hardware with a subscription-free model.
- **SenseNode:** Outdoor-rated (IP67) alternative [sensor hardware](./sensor-hardware.md).
- **MeshSync:** The underlying mesh synchronization software or protocol used by the widgets.
- **[Mira](./aurora-labs.md):** Developer or community contributor who provided guidance on GitHub regarding node limits.
- **Alex:** Author of a blog discussing [hardware specifications](./hardware-specifications.md).

## Related Concepts
- **Node Rejoin Issues:** Problems experienced by devices attempting to reconnect to the mesh network when exceeding recommended density limits.
- **[Hardware Teardowns](./hardware-teardowns.md) vs. [Documentation](./documentation.md):** Discrepancies between official specifications and physical hardware findings.

## Contradictions
&gt; **Contradiction:** There is a conflict regarding the [battery specifications](./battery-specifications.md) of the Aurora Nova. Alex's blog states that the device uses a CR2450 battery, whereas a physical teardown of the hardware revealed it uses a CR2032 battery instead.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |

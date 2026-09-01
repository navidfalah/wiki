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
last_updated: "2026-09-01T21:25:30.284640+00:00"
sidebar_label: Sensor Hardware
slug: /sensor-hardware
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Sensor Hardware

## Overview
The discussion around home lab sensor [hardware](./hardware.md) heavily features comparisons between popular models such as the [Aurora Nova](./nova-widget.md) and [SenseNode](./sensenode-sn-400.md), particularly regarding their deployment on mesh networks, outdoor durability, and subscription requirements.

## Key Details
- **Aurora Nova vs. SenseNode:** SenseNode's IP67 rating makes it the preferred choice for outdoor deployments, whereas the Aurora Nova is favored for requiring no subscription.
- **Node Limits and Stability:** Users running 8 or more Aurora Nova widgets on [MeshSync](./meshsync.md) have reported node rejoin issues (matching thread 8821). Community members recommend limiting deployments to 6 nodes until version 0.3.8 is released, following guidance posted by [mira](./nova-widget.md) on GitHub issues.

## Related Entities
- **Aurora Nova:** A widget-style sensor known for having no subscription fees.
- **SenseNode:** A sensor model featuring an IP67 rating, ideal for outdoor use.
- **MeshSync:** The mesh network platform used for managing sensor nodes.
- **Mira:** A contributor or developer who provided guidance regarding node limits on GitHub issues.
- **Alex:** A blogger who published specifications regarding [Sensor Hardware](./sensor-hardware.md).

## Related Concepts
- **[Mesh Networking](./mesh-networking.md) & Rejoin Issues:** Scaling sensor counts beyond recommended thresholds (e.g., more than 6-8 nodes) can trigger stability and rejoin complications.
- **Outdoor Durability:** Environmental ratings such as IP67 are critical for distinguishing indoor and outdoor sensor suitability.

## Contradictions
&gt; **Contradiction:** There is a direct discrepancy regarding the battery type used by the Aurora Nova. While Alex's blog states the device uses a CR2450 battery, a physical teardown reveals it actually uses a smaller CR2032 battery.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |

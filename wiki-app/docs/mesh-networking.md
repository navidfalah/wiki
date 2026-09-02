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
last_updated: "2026-09-02T06:40:43.923343+00:00"
sidebar_label: Mesh Networking
slug: /mesh-networking
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Mesh Networking

## Overview
Mesh [networking](./networking.md) discussions center around the practical deployment of smart home and [sensor hardware](./sensor-hardware.md)—specifically comparing devices like the [Aurora Nova](./aurora-nova-widget-v2.md) and [SenseNode](./sensenode-sn-400.md), and managing scaling constraints on [protocols](./protocols.md) like [MeshSync](./meshsync.md). Real-world user feedback highlights hardware quirks, [firmware](./firmware.md) limitations, and environmental use cases.

## Key Details
- **Node Scaling Limitations:** Users running 8 or more Aurora Nova widgets on MeshSync have reported node rejoin issues (noted as matching thread 8821). It is recommended by community members (such as [mira](./aurora-nova-widget-v2.md) via GitHub issues) to limit deployments to a maximum of 6 nodes until version 0.3.8 is released.
- **Hardware Comparison:** 
  - **SenseNode:** Favored for outdoor deployments due to its IP67 rating.
  - **Aurora Nova:** Favored because it operates without requiring a subscription.

## Related Entities
- **Aurora Nova:** A widget/sensor hardware line used in mesh setups.
- **SenseNode:** An alternative IP67-rated sensor node designed for outdoor use.
- **MeshSync:** The mesh networking protocol/software layer managing node communication.
- **Mira:** A community member/developer who provided guidance regarding GitHub issues and node limits.
- **Alex:** A blogger/writer who published [documentation](./documentation.md) regarding device specifications.

## Related Concepts
- **Node Rejoin Issues:** Problems where nodes drop off the mesh network and fail to reconnect cleanly, particularly when scaling past 6 units on current firmware versions.
- **Outdoor Sensor Ratings:** The necessity of weatherproofing (IP67) for exterior [home automation](./home-automation.md) [sensors](./sensors.md).
- **Subscription-free Hardware:** Consumer preference for local-only or subscription-free device ecosystems.

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the power source of the Aurora Nova. Alex's blog states that the device uses a CR2450 battery, whereas a physical teardown reveals that it actually uses a smaller CR2032 battery.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |

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
last_updated: "2026-09-01T21:24:03.927891+00:00"
sidebar_label: Mesh Networking
slug: /mesh-networking
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Mesh Networking

## Overview
Mesh [networking](./networking.md) in the context of consumer and homelab sensor ecosystems involves coordinating multiple wireless nodes to extend range and reliability. Discussions within communities frequently center around [hardware](./hardware.md) performance, node scaling limitations, and protocol management via tools like [MeshSync](./meshsync.md).

## Key Details
- **Node Scaling:** Users running larger deployments (such as 8+ [Aurora Nova](./nova-widget.md) widgets on MeshSync) have reported node rejoin issues, which correspond to known issues tracked in community discussions (e.g., thread 8821). 
- **[Firmware](./firmware.md) Recommendations:** To maintain stability, users are advised to cap deployments at 6 nodes until firmware version 0.3.8 is released, a recommendation noted by [Mira](./nova-widget.md) on GitHub issues.
- **Hardware Comparison:** 
  - **[SenseNode](./sensenode-sn-400.md):** Favored for outdoor use due to its IP67 rating.
  - **Aurora Nova:** Preferred for operating without a subscription.
- **Hardware Discrepancies:** Real-world teardowns of devices have exposed inconsistencies between official [documentation](./documentation.md) and physical [hardware specifications](./hardware-specifications.md).

## Related Entities
- **Aurora Nova:** A subscription-free widget option used in mesh networks.
- **SenseNode:** An IP67-rated outdoor sensor node alternative.
- **MeshSync:** A coordination or management tool for mesh nodes.
- **Mira:** A contributor or developer active on GitHub issues regarding mesh firmware.
- **Alex:** A blogger/writer whose documentation has been scrutinized for hardware specifications.

## Related Concepts
- **Node Rejoin Issues:** Connectivity problems where nodes fail to smoothly re-establish a link with the mesh after dropping offline, particularly noticeable when exceeding recommended node counts.
- **[Hardware Teardowns](./hardware-teardowns.md):** Physical examination of devices that can reveal discrepancies against manufacturer claims.

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the [battery specifications](./battery-specifications.md) for the Aurora Nova hardware. While Alex's blog states the devices use CR2450 batteries, physical teardowns of the hardware show they actually utilize CR2032 batteries.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |

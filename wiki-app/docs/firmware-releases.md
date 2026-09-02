---
id: firmware-releases
title: Firmware Releases
tags:
  - aurora-labs
  - firmware-releases
  - jonah-park
  - mira-chen
  - mqtt-export-schema-v2
  - parent-election-logging
  - rejoin-storm-mitigation
  - sam-rivera
last_updated: "2026-09-02T06:39:29.479487+00:00"
sidebar_label: Firmware Releases
slug: /firmware-releases
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Releases

## Overview
This page documents official [firmware](./firmware.md) [release notes](./release-notes.md) and updates from [Aurora Labs](./aurora-labs.md), focusing on the [MeshSync](./meshsync.md) firmware line (specifically version 0.3.8 released on July 2, 2026). The release addresses key network stability challenges, introduces diagnostic logging, and outlines specifications for deployment.

## Key Details
- **Release Date:** July 2, 2026
- **Version:** MeshSync 0.3.8
- **Owners:** [Mira Chen](./aurora-nova-widget-v2.md) (Firmware), Jonah Park (QA Sign-off)
- **Highlights:**
  - Rejoin storm mitigation implemented for meshes exceeding 6 nodes (resolving a known issue present since beta).
  - Parent election logging now exports RSSI and hop count via debug UART.
  - Power spike on rejoin has been reduced from 340µA to 180µA.
- **Breaking Changes:**
  - Default read interval is set to **15 minutes** (correcting earlier kickoff slide errors that stated hourly intervals).
  - Introduction of [MQTT export](./mqtt-export.md) schema v2, which is optional and restricted to local brokers.
- **Known Issues:**
  - Networks with 8 or more nodes remain unstable in field reports (tracked under ticket #2099).
  - [Battery life](./battery-life.md) projections differ: engineering estimates 18 months at 10 nodes, whereas marketing claims 2 years.

## Related Entities
- **Aurora Labs:** Organization responsible for the MeshSync firmware and [Nova Widget](./nova-widget.md) ecosystem.
- **Mira Chen:** Firmware owner.
- **Jonah Park:** QA sign-off owner.
- **Sam Rivera:** Inquired about integrating tea timer synchronization capabilities.

## Related Concepts
- **MeshSync:** The core mesh synchronization [firmware architecture](./firmware-architecture.md).
- **Nova Widget:** [Hardware](./hardware.md) device/widget associated with the MeshSync firmware release.
- **Rejoin Storm Mitigation:** Mechanism to stabilize network reconnections when node counts grow.
- **MQTT Export Schema v2:** Version 2 of the local broker telemetry and export schema format.

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding battery life expectations. Engineering estimates a battery lifespan of 18 months at 10 nodes, while marketing materials continue to advertise a 2-year lifespan.
&gt; 
&gt; **Contradiction:** Kickoff slides incorrectly claimed that the default read interval would be hourly, whereas the actual release mandates a default read interval of 15 minutes.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-02-aurora-meshsync-release-notes.md` | text | Unverified |

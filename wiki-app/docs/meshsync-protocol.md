---
id: meshsync-protocol
title: MeshSync Protocol
tags:
  - aurora
  - aurora-nova-widget-v2
  - jonah-park
  - meshsync
  - meshsync-protocol
  - meshsync-protocol-header
  - mira-chen
  - parent-election
last_updated: "2026-09-10T14:39:17.104358+00:00"
sidebar_label: MeshSync Protocol
slug: /meshsync-protocol
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MeshSync Protocol

## Overview

The [MeshSync](./meshsync.md) protocol is a local [mesh networking](./mesh-networking.md) protocol designed for open-source environmental [sensors](./sensors.md), such as the [Aurora Nova Widget v2 beta](./aurora-nova-widget-v2.md) unit. It enables communication between soil moisture and temperature sensor nodes without requiring a mandatory cloud connection. The protocol [configuration](./configuration.md) defined in `meshsync.h` (v0.3 excerpt) establishes a theoretical maximum of 32 nodes, though [beta testing](./beta-testing.md) has encountered stability issues at higher node counts.

## Key Details

- **Node Capacity:** Supports a theoretical maximum of 32 nodes (`MESHSYNC_MAX_NODES`), with beta-safe limits defined at 6 nodes.
- **Sampling Interval:** Uses a default sampling interval of 15 minutes (`MESHSYNC_DEFAULT_INTERVAL_MIN`), while hourly intervals are explicitly deprecated.
- **Roles:** Node roles are categorized into parent (`MESHSYNC_ROLE_PARENT`), child (`MESHSYNC_ROLE_CHILD`), and lost/rejoin storm state (`MESHSYNC_ROLE_LOST`).
- **Parent Election:** Relies on an RSSI-weighted random backoff mechanism referenced from a July 3 whiteboard.
- **Power and Performance:** The Aurora Nova Widget v2 operates with a sleep current of 4.2 µA, a sample and transmit peak of 12 mA every 15 minutes, and a known rejoin spike issue ranging from 110 µA to 340 µA.

## Related Entities

- **Aurora Nova Widget v2 beta unit:** The primary [hardware](./hardware.md) utilizing the MeshSync protocol.
- **[Mira Chen](./aurora-nova-widget-v2.md):** [Firmware](./firmware.md) owner for the Aurora Nova Widget v2.
- **Jonah Park:** Hardware owner for the Aurora Nova Widget v2.
- **[TeaBuddy](./teabuddy.md):** An unrelated device mentioned in kickoff meetings whose integration request was formally denied per the partnership memo.
- **[SenseNode SN-400](./sensenode-sn-400.md):** A competitor product used for comparative analysis.

## Related Concepts

- Local mesh networking
- Soil moisture and temperature sensing
- Parent election algorithms (RSSI-weighted random backoff)
- Rejoin storm states and [power budget](./power-budget.md) management

## Contradictions

&gt; **Contradiction:** Sources conflict regarding the upper stability threshold during beta testing. The Nova Widget spec fragment states that the protocol has been beta tested up to 8 nodes (noting it is unstable), whereas the `meshsync.h` header file defines the beta-safe node limit as 6 (`MESHSYNC_BETA_SAFE_NODES`).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |
| 2 | `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt` | text | Unverified |

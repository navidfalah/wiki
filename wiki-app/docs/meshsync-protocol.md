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
last_updated: "2026-09-02T06:40:48.670881+00:00"
sidebar_label: MeshSync Protocol
slug: /meshsync-protocol
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MeshSync Protocol

## Overview

The [MeshSync](./meshsync.md) protocol is a local mesh communication protocol designed for open-source environmental [sensors](./sensors.md), specifically utilized in the [Aurora Nova Widget v2 beta](./aurora-nova-widget-v2.md) unit. It allows soil moisture and temperature sensors to operate locally without requiring a mandatory cloud connection. The protocol manages node roles, packet intervals, and network topology for up to 32 theoretical nodes.

## Key Details

- **Node Limits:** Supports a theoretical maximum of 32 nodes (`MESHSYNC_MAX_NODES`), though [beta testing](./beta-testing.md) to 8 nodes has proven unstable, and protocol header specifications suggest a beta-safe limit of 6 nodes (`MESHSYNC_BETA_SAFE_NODES`).
- **Roles:** Node roles are defined via `meshsync_role_t` and include parent (`MESHSYNC_ROLE_PARENT`), child (`MESHSYNC_ROLE_CHILD`), and lost/rejoin storm state (`MESHSYNC_ROLE_LOST`).
- **Parent Election:** Handled via an RSSI-weighted random backoff mechanism (referenced from the July 3 whiteboard).
- **Timing Intervals:** The default sample and transmission interval is 15 minutes (`MESHSYNC_DEFAULT_INTERVAL_MIN`), and hourly intervals are officially deprecated.
- **Power Impact:** Operates alongside [hardware](./hardware.md) power budgets that target 4.2 µA in sleep mode, 12 mA peak for sampling and transmission, and a known rejoin spike issue ranging between 110–340 µA.

## Related Entities

- **Aurora Nova Widget v2:** The beta hardware unit utilizing the MeshSync protocol.
- **[Mira Chen](./aurora-nova-widget-v2.md):** [Firmware](./firmware.md) owner for the Aurora Nova Widget v2.
- **Jonah Park:** Hardware owner for the Aurora Nova Widget v2.
- **[SenseNode SN-400](./sensenode-sn-400.md):** Competitor device used for comparison.
- **[TeaBuddy](./teabuddy.md):** Unrelated product mentioned in kickoff; integration requests with MeshSync have been officially denied.

## Related Concepts

- **Local [Mesh Networking](./mesh-networking.md):** Device-to-device communication operating independently of cloud infrastructure.
- **Parent Election:** The algorithmic process by which nodes determine network hierarchy based on signal strength (RSSI).
- **Rejoin Storm State:** A network recovery condition (`MESHSYNC_ROLE_LOST`) characterized by spikes in [power consumption](./power-consumption.md) (110–340 µA) when multiple nodes attempt to reconnect simultaneously.

## Contradictions

&gt; **Contradiction:** There is a discrepancy regarding the stable beta node capacity of the network. The Nova Widget spec fragment states that the protocol has been beta tested up to 8 nodes (noting instability), whereas the `meshsync.h` protocol header explicitly defines `MESHSYNC_BETA_SAFE_NODES` as 6.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |
| 2 | `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt` | text | Unverified |

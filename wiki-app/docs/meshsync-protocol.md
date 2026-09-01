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
last_updated: "2026-09-01T21:24:07.456782+00:00"
sidebar_label: MeshSync Protocol
slug: /meshsync-protocol
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MeshSync Protocol

## Overview

The [MeshSync](./meshsync.md) protocol is a local mesh communication protocol utilized by open-source soil moisture and temperature [sensors](./sensors.md) such as the [Aurora Nova Widget v2](./aurora-nova-widget-v2.md) unit (managed by [firmware](./firmware.md) owner Mira Chen and [hardware](./hardware.md) owner Jonah Park). It operates entirely locally without mandatory cloud dependency, supporting communication and synchronization across network nodes.

## Key Details

- **Node Capacity:** The protocol supports a theoretical maximum of 32 nodes (`MESHSYNC_MAX_NODES`), though [Beta Testing](./beta-testing.md) has encountered instability when scaling beyond 8 nodes. Furthermore, the protocol header safe node limit is specified as 6 nodes (`MESHSYNC_BETA_SAFE_NODES`).
- **Roles:** Nodes operate within defined roles managed by the protocol (`meshsync_role_t`), which include parent (`MESHSYNC_ROLE_PARENT`), child (`MESHSYNC_ROLE_CHILD`), and lost/rejoin storm state (`MESHSYNC_ROLE_LOST`).
- **Intervals:** The default sample and transmission interval is 15 minutes (`MESHSYNC_DEFAULT_INTERVAL_MIN`), and hourly intervals are formally deprecated.
- **Parent Election:** Parent election is governed by an RSSI-weighted random backoff mechanism (referenced from a July 3 whiteboard).

## Related Entities

- **Aurora Nova Widget v2:** The beta hardware unit utilizing the MeshSync protocol.
- **Mira Chen:** Firmware owner for the Aurora Nova Widget project.
- **Jonah Park:** Hardware owner for the Aurora Nova Widget project.
- **[SenseNode SN-400](./sensenode-sn-400.md):** A competitor product used for comparative analysis.
- **[TeaBuddy](./teabuddy.md):** An external project whose integration request was denied per partnership memos.

## Related Concepts

- **Local [Mesh Networking](./mesh-networking.md):** Device-to-device communication operating without mandatory cloud connectivity.
- **[Power Budget](./power-budget.md):** Managing [Power Consumption](./power-consumption.md) states including sleep mode (4.2 µA), sample and transmission spikes (12 mA peak), and rejoin spikes.

## Contradictions

&gt; **Contradiction:** There is a discrepancy regarding beta stability limits between the widget spec fragment and the protocol header file. The Nova Widget spec fragment states that the protocol has been beta tested up to 8 nodes (noting instability), whereas the `meshsync.h` protocol header explicitly defines the beta safe nodes macro (`MESHSYNC_BETA_SAFE_NODES`) as 6.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |
| 2 | `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt` | text | Unverified |

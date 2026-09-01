---
id: meshsync-protocol
title: MeshSync Protocol
tags:
  - aurora
  - aurora-nova-widget-v2
  - meshsync
  - meshsync-protocol
  - meshsync-protocol-header
  - parent-election
last_updated: "2026-09-01T19:19:59.145793+00:00"
sidebar_label: MeshSync Protocol
slug: /meshsync-protocol
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MeshSync Protocol

## Overview

The MeshSync Protocol is a local mesh communication protocol designed to operate without mandatory cloud dependency, primarily utilized by open-source soil moisture and temperature [sensors](./sensors.md) such as the [Aurora Nova Widget v2 beta](./aurora-labs.md) unit. The protocol facilitates decentralized node [networking](./networking.md), supporting low-power operations and local data sharing.

## Key Details

- **Node Limits:** The protocol supports a theoretical maximum of 32 nodes (`MESHSYNC_MAX_NODES`), though beta tests in the Nova Widget spec indicate it has only been stable up to 8 nodes, while protocol header definitions establish a beta-safe limit of 6 nodes (`MESHSYNC_BETA_SAFE_NODES`).
- **Roles:** Nodes operate within roles defined by `meshsync_role_t`, which include parent (`MESHSYNC_ROLE_PARENT`), child (`MESHSYNC_ROLE_CHILD`), and lost/rejoin storm state (`MESHSYNC_ROLE_LOST`).
- **Intervals:** The default sampling and transmission interval is 15 minutes (`MESHSYNC_DEFAULT_INTERVAL_MIN`), while hourly intervals have been officially deprecated.
- **Parent Election:** Parent election is handled via an RSSI-weighted random backoff mechanism (referenced from a July 3 whiteboard), though initial product specs noted this section was incomplete or relied on whiteboard notes.
- **Power Impact:** In implementations like the [Aurora Nova Widget v2](./aurora-nova-widget-v2.md), the protocol contributes to a sample and TX peak of 12 mA, with a known issue causing a rejoin spike of 110–340 µA.

## Related Entities

- **Aurora Nova Widget v2:** The beta unit [hardware](./hardware.md) utilizing the MeshSync protocol for local mesh sensor data.
- **[Mira Chen](./aurora-labs.md):** [Firmware](./firmware.md) owner for the Aurora Nova Widget v2.
- **Jonah Park:** Hardware owner for the Aurora Nova Widget v2.
- **[TeaBuddy](./teabuddy.md):** An unrelated device mentioned in kickoff meetings, for which integration requests were formally denied.

## Related Concepts

- **Local [Mesh Networking](./mesh-networking.md):** Device-to-device communication operating independently of cloud services.
- **RSSI-Weighted Random Backoff:** The algorithmic approach utilized for parent node election within the mesh network.
- **Rejoin Storm State:** A network state (`MESHSYNC_ROLE_LOST`) associated with power spikes during node reconnection attempts.

## Contradictions

&gt; **Contradiction:** There is a discrepancy regarding the reliable stability limits of the beta network. The Aurora Nova Widget spec states that the protocol has been beta tested up to 8 nodes (noting it is unstable), whereas the `meshsync.h` protocol header explicitly defines a beta-safe node limit of 6 (`MESHSYNC_BETA_SAFE_NODES`).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |
| 2 | `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt` | text | Unverified |

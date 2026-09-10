---
id: bug-reports
title: "Bug Reports: MeshSync #442 Rejoin Storm"
tags:
  - aurora-labs
  - bug-reports
  - meshfan
  - meshsync
  - mira-chen
  - parent-election-rewrite
  - potato99
  - rejoin-storm
last_updated: "2026-09-10T14:37:32.104398+00:00"
sidebar_label: "Bug Reports: MeshSync #442 Rejoin Storm"
slug: /bug-reports
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bug Reports: MeshSync #442 Rejoin Storm

## Overview

This page documents [Bug Reports](./bug-reports.md) and tracking associated with **[Aurora Labs](./aurora-labs.md)/[MeshSync](./meshsync.md) #442**, concerning a persistent rejoin storm and multi-hour network silence occurring on [Firmware](./firmware.md) version `0.3.8`.

## Key Details

- **Issue Title:** Rejoin storm persists at 8 nodes on 0.3.8
- **Repository:** `aurora-labs/meshsync` (Issue #442)
- **State:** Open
- **Labels:** `bug`, `power`, `beta`
- **Symptoms:** Users report multi-hour silence after adding an 8th node to the network, despite units being flashed with firmware `0.3.8`.
- **Workaround:** Cap networks at a maximum of 6 nodes.
- **Resolution Plan:** The `0.3.9` milestone has been moved up to implement a complete parent election rewrite.

## Related Entities

- **@potato99:** Initial reporter who noted the multi-hour silence after adding the 8th node.
- **@[mira-chen](./aurora-nova-widget-v2.md):** [Aurora Labs](./aurora-labs.md) representative managing the issue, requesting RSSI logs to `support@` and announcing the accelerated `0.3.9` milestone.
- **@meshfan:** Beta community member noting slight improvements in `0.3.8` while comparing stability to competing [SenseNode](./sensenode.md) [Hardware](./hardware.md).
- **@teaguy:** Community member who posted an off-topic comment in the repository thread.

## Related Concepts

- **Rejoin Storm:** A network phenomenon where multiple nodes simultaneously attempt to reconnect or re-establish routes, leading to excessive congestion and prolonged downtime.
- **Parent Election Rewrite:** The upcoming core logic revision scheduled for version `0.3.9` to address network stability and node hierarchy selection issues.
- **[Beta Testing](./beta-testing.md):** Early-stage software deployment (`0.3.8`, `0.3.9`) utilized to capture real-world telemetry and logs (such as RSSI metrics) from community members.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt` | text | Unverified |

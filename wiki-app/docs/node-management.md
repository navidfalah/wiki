---
id: node-management
title: Node Management
tags:
  - meshfan
  - meshsync
  - mira-chen
  - node-management
  - parent-election
  - potato99
  - rejoin-storm
  - sensenode
last_updated: "2026-09-02T06:40:59.521954+00:00"
sidebar_label: Node Management
slug: /node-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Node Management

## Overview
Node management within the `aurora-labs/meshsync` project encompasses network scaling, stability, and parent election [protocols](./protocols.md). Recent GitHub issue tracking (Issue #442) highlights ongoing challenges with multi-node setups running version 0.3.8, specifically concerning prolonged network silences and rejoin storms when networks exceed six nodes.

## Key Details
- **Issue #442 ("Rejoin storm persists at 8 nodes on 0.3.8")**: Open bug report concerning multi-hour silence occurring specifically after the addition of an 8th node in deployments using [firmware](./firmware.md) version 0.3.8.
- **Workaround**: Developers recommend capping network deployments at a maximum of 6 nodes until a permanent fix is released.
- **[Troubleshooting](./troubleshooting.md) Requirements**: Users experiencing the issue are asked to submit RSSI logs to support@.
- **Upcoming Fixes**: In response to the persistent rejoin storm, milestone 0.3.9 has been moved up to incorporate a complete rewrite of the parent election mechanism.

## Related Entities
- **@potato99**: GitHub user who originally reported the multi-hour silence and rejoin storm issue on version 0.3.8.
- **@[mira-chen](./aurora-nova-widget-v2.md)**: [Aurora Labs](./aurora-labs.md) maintainer/developer managing the issue, requesting RSSI logs, suggesting the 6-node cap workaround, and advancing the 0.3.9 parent election rewrite.
- **@meshfan**: Community commenter noting that while version 0.3.8 is an improvement, the issue remains unresolved.
- **@teaguy**: Commenter on the GitHub thread who noted a potential repository mismatch.
- **[SenseNode](./sensenode-sn-400.md)**: Alternative system/user referenced by community members regarding mesh complexity comparisons.

## Related Concepts
- **Rejoin Storm**: A network phenomenon where multiple nodes repeatedly attempt to reconnect or synchronize simultaneously, leading to network congestion, packet loss, and extended periods of silence.
- **Parent Election**: The algorithmic process by which nodes in a mesh network select their primary routing parent or gateway. A rewrite of this system is planned for version 0.3.9 to address scaling limitations.
- **Firmware Versioning (0.3.8 / 0.3.9)**: The iterative release cycle dealing directly with power, stability, and scaling bugs in beta [hardware](./hardware.md).

## Contradictions
*(No contradictions present in the current data source.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt` | text | Unverified |

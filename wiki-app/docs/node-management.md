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
last_updated: "2026-09-01T21:24:18.006002+00:00"
sidebar_label: Node Management
slug: /node-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Node Management

## Overview
Node management within the `aurora-labs/meshsync` project encompasses the configuration, stability, and scaling behaviors of network nodes. A notable issue tracked in GitHub issue #442 highlights challenges with multi-hour silence and rejoin storms occurring when networks scale up to 8 nodes, even after flashing units with version 0.3.8.

## Key Details
- **Rejoin Storm Issue:** Users report prolonged multi-hour silence and rejoin storms once an 8th node is added to a network running version 0.3.8.
- **Current Workaround:** Maintainers recommend capping the network at a maximum of 6 nodes until further patches are released.
- **[Debugging](./debugging.md) & Telemetry:** Users experiencing these issues are advised to send RSSI logs to support.
- **Upcoming Fixes:** The [Release 0.3.9](./release-039.md) milestone has been moved up to address these stability issues via a complete parent election rewrite.

## Related Entities
- **@potato99:** GitHub user who originally reported the persistent rejoin storm on version 0.3.8 after adding an 8th node.
- **@[mira-chen](./nova-widget.md):** Maintainer/developer who requested RSSI logs, provided the 6-node workaround, and announced the accelerated 0.3.9 milestone featuring a parent election rewrite.
- **@meshfan:** Community contributor noting that version 0.3.8 is an improvement but still incomplete.
- **@teaguy:** GitHub commenter who chimed in on the thread.
- **[SenseNode](./sensenode-sn-400.md):** Alternative ecosystem/user mentioned in discussions regarding network complexity comparisons.
- **[aurora](./nova-widget.md)-labs/[meshsync](./meshsync.md):** The GitHub repository tracking the mesh synchronization and node management bugs.

## Related Concepts
- **Parent Election:** The mechanism by which nodes determine their network hierarchy and routing paths, currently scheduled for a rewrite in version 0.3.9 to solve scaling bugs.
- **Rejoin Storm:** A network phenomenon where multiple nodes repeatedly attempt to reconnect simultaneously, leading to cascading delays and prolonged network silence.
- **RSSI Logs:** Received Signal Strength Indication logs used by support to diagnose connection and range issues during node scaling events.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt` | text | Unverified |

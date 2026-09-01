---
id: bug-reports
title: Bug Reports
tags:
  - bug-reports
  - meshfan
  - meshsync
  - mira-chen
  - parent-election
  - potato99
  - rejoin-storm
  - sensenode
last_updated: "2026-09-01T19:18:10.046985+00:00"
sidebar_label: Bug Reports
slug: /bug-reports
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bug Reports

## Overview
This page documents software bug reports and issues affecting distributed [mesh networking](./mesh-networking.md) components, specifically focusing on GitHub issue tracking for the `aurora-labs/meshsync` repository under version 0.3.x releases.

## Key Details
- **Issue Reference:** `aurora-labs/meshsync #442`
- **Title:** Rejoin storm persists at 8 nodes on 0.3.8
- **State:** Open
- **Labels:** `bug`, `power`, `beta`
- **Core Symptom:** Multi-hour silence observed after adding an 8th node to a network running version 0.3.8 (flashed across all units).
- **Workaround:** Cap the network at 6 nodes while investigations continue.
- **[Troubleshooting](./troubleshooting.md) Requirements:** RSSI logs requested by maintainers to be sent to support.
- **Future Roadmap:** [Release 0.3.9](./release-039.md) milestone moved up to address the underlying issue through a complete rewrite of the parent election mechanism.

## Related Entities
- **@potato99:** Issue reporter who experienced the multi-hour silence and rejoin storm on 0.3.8.
- **@[mira-chen](./aurora-labs.md):** Maintainer/developer responding to the issue, requesting logs, providing the 6-node workaround, and announcing the 0.3.9 parent election rewrite.
- **@meshfan:** Community contributor noting slight improvements in 0.3.8 while confirming the bug persists.
- **@teaguy:** User posting off-topic commentary regarding the repository.
- **[SenseNode SN-400](./sensenode-sn-400.md):** External platform/node ecosystem referenced in community discussions regarding mesh complexity.

## Related Concepts
- **Rejoin Storm:** A network phenomenon where multiple nodes repeatedly attempt to reconnect or synchronize simultaneously, leading to cascading failures or prolonged silence.
- **Parent Election:** The algorithm and protocol used by mesh nodes to determine hierarchical routing and upstream connections; scheduled for a rewrite in version 0.3.9.
- **RSSI Logs:** Received Signal Strength Indication logs used for diagnosing wireless link quality and connection stability issues.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt` | text | Unverified |

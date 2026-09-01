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
last_updated: "2026-09-01T21:22:19.711250+00:00"
sidebar_label: Bug Reports
slug: /bug-reports
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bug Reports

## Overview
This page documents software and [hardware](./hardware.md) bug reports associated with the `aurora-labs/meshsync` repository, specifically tracking network stability issues under version 0.3.8.

## Key Details
- **Issue:** Rejoin storm persists at 8 nodes on version 0.3.8 (`aurora-labs/meshsync #442`)
- **State:** Open
- **Labels:** bug, power, beta
- **Reported Behavior:** Users experience multi-hour silence after adding an 8th node to the network, despite units being flashed with version 0.3.8.
- **Workaround:** Cap the network at a maximum of 6 nodes.
- **[Troubleshooting](./troubleshooting.md) Requirements:** [Mira Chen](./nova-widget.md) requested that RSSI logs be sent to support.
- **Resolution Roadmap:** The 0.3.9 milestone has been moved up to include a complete parent election rewrite to address the issue.

## Related Entities
- `aurora-labs/meshsync` (GitHub Repository)
- `@potato99` (Issue reporter)
- `@mira-chen` (Maintainer / Project contributor)
- `@meshfan` (Community participant)
- `@teaguy` (Community participant)

## Related Concepts
- Rejoin storm
- Parent election
- Network topology scaling
- RSSI logging

## Contradictions
*(No contradictions present in the current data sources.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt` | text | Unverified |

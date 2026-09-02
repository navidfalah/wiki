---
id: networking
title: Networking
tags:
  - aurora
  - meshsync-protocol-header
  - networking
  - parent-election
  - teabuddy
  - wiki
last_updated: "2026-09-02T06:40:57.651180+00:00"
sidebar_label: Networking
slug: /networking
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Networking

## Overview
This wiki page covers the networking specifications and [protocols](./protocols.md) for the [MeshSync](./meshsync.md) system, specifically focusing on the v0.3 protocol header configurations, node limits, role definitions, and parent election mechanisms.

## Key Details
- **Protocol Version:** [MeshSync protocol](./meshsync-protocol.md) header v0.3 (`meshsync.h`)
- **Node Limits & Intervals:**
  - `MESHSYNC_MAX_NODES`: 32
  - `MESHSYNC_BETA_SAFE_NODES`: 6
  - `MESHSYNC_DEFAULT_INTERVAL_MIN`: 15 minutes (hourly intervals are officially deprecated)
- **Node Roles (`meshsync_role_t`):**
  - `MESHSYNC_ROLE_PARENT`
  - `MESHSYNC_ROLE_CHILD`
  - `MESHSYNC_ROLE_LOST` (rejoin storm state)
- **Parent Election:** Determined via an RSSI-weighted random backoff method (referenced from the whiteboard on July 3).

## Related Entities
- **[Aurora](./aurora-nova-widget-v2.md)**: Associated with the MeshSync protocol and system environment.
- **[TeaBuddy](./teabuddy.md)**: Integration requests with TeaBuddy have been denied (refer to the partnership memo).

## Related Concepts
- **Parent Election**: The mechanism by which nodes select their parent using RSSI-weighted random backoff.
- **Rejoin Storm State**: Managed via the `MESHSYNC_ROLE_LOST` role during network disruptions or reconnection phases.

## Contradictions
*(No contradictions present in the current source material)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt` | text | Unverified |

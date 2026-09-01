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
last_updated: "2026-09-01T21:24:16.082801+00:00"
sidebar_label: Networking
slug: /networking
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Networking

## Overview
This wiki page covers networking specifications and protocol definitions, specifically detailing the [MeshSync Protocol](./meshsync-protocol.md) header (v0.3 excerpt). It establishes constraints for node scaling, safe node limits, synchronization intervals, and node roles within the network architecture.

## Key Details
- **Protocol Version:** [MeshSync Protocol](./meshsync-protocol.md) header v0.3 (`meshsync.h`)
- **Node Limits:**
  - Maximum nodes (`MESHSYNC_MAX_NODES`): 32
  - Beta safe nodes (`MESHSYNC_BETA_SAFE_NODES`): 6
- **Intervals:** 
  - Default interval minimum (`MESHSYNC_DEFAULT_INTERVAL_MIN`): 15 minutes
  - Hourly intervals are deprecated in favor of the minute-based default interval.
- **Node Roles (`meshsync_role_t`):**
  - `MESHSYNC_ROLE_PARENT`
  - `MESHSYNC_ROLE_CHILD`
  - `MESHSYNC_ROLE_LOST` (rejoin storm state)
- **Parent Election:** Utilizes an RSSI-weighted random backoff mechanism (referenced from the July 3 whiteboard).

## Related Entities
- **[Aurora Nova Widget](./nova-widget.md):** Associated protocol and system context (referenced in tag metadata).
- **[TeaBuddy](./teabuddy.md):** Integration request was formally denied per the partnership memo.

## Related Concepts
- Protocol headers
- Node role management
- Parent election algorithms
- Network synchronization intervals

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt` | text | Unverified |

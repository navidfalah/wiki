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
last_updated: "2026-09-01T19:20:09.672625+00:00"
sidebar_label: Networking
slug: /networking
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Networking

## Overview
This wiki page covers the networking specifications and protocol definitions associated with the [MeshSync protocol](./meshsync-protocol.md) (version 0.3), detailing node limitations, roles, and interval configurations.

## Key Details
- **Protocol Version:** [MeshSync protocol](./meshsync-protocol.md) header v0.3 (`meshsync.h`)
- **Node Limits:** 
  - Maximum nodes (`MESHSYNC_MAX_NODES`): 32
  - Beta safe nodes (`MESHSYNC_BETA_SAFE_NODES`): 6
- **Interval Configuration:** 
  - Default interval minimum (`MESHSYNC_DEFAULT_INTERVAL_MIN`): 15 minutes
  - *Note:* The hourly interval is deprecated in favor of `MESHSYNC_DEFAULT_INTERVAL_MIN`.
- **Node Roles (`meshsync_role_t`):**
  - `MESHSYNC_ROLE_PARENT`
  - `MESHSYNC_ROLE_CHILD`
  - `MESHSYNC_ROLE_LOST` (rejoin storm state)
- **Parent Election:** Utilizes an RSSI-weighted random backoff mechanism (referenced from the July 3 whiteboard).

## Related Entities
- **[Aurora](./aurora-labs.md)**
- **MeshSync**

## Related Concepts
- **MeshSync Protocol Header**
- **Parent Election**
- **[TeaBuddy](./teabuddy.md) Integration**

## Contradictions
*(No direct contradictions present in the current source material, though a TeaBuddy integration request was explicitly denied per the partnership memo.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt` | text | Unverified |

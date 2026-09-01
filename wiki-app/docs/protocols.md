---
id: protocols
title: Protocols
tags:
  - aurora
  - meshsync-protocol-header
  - parent-election
  - protocols
  - teabuddy
  - wiki
last_updated: "2026-09-01T19:21:12.590415+00:00"
sidebar_label: Protocols
slug: /protocols
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Protocols

## Overview
This wiki page outlines specifications and implementation details regarding [networking](./networking.md) and synchronization protocols, specifically focusing on the [MeshSync Protocol](./meshsync-protocol.md) version 0.3 header definitions and [node management](./node-management.md) rules associated with the [Aurora Labs](./aurora-labs.md) project.

## Key Details
* **Protocol Version**: MeshSync v0.3 (excerpt derived from `meshsync.h`).
* **Node Limits & Intervals**:
  * Maximum nodes (`MESHSYNC_MAX_NODES`): 32
  * Beta safe nodes (`MESHSYNC_BETA_SAFE_NODES`): 6
  * Default interval (`MESHSYNC_DEFAULT_INTERVAL_MIN`): 15 minutes (note: the hourly interval has been officially deprecated in favor of this setting).
* **Node Roles (`meshsync_role_t`)**:
  * `MESHSYNC_ROLE_PARENT`
  * `MESHSYNC_ROLE_CHILD`
  * `MESHSYNC_ROLE_LOST` (represents the rejoin storm state)
* **Parent Election**: Utilizes an RSSI-weighted random backoff mechanism (referencing whiteboard notes from July 3).

## Related Entities
* **Aurora**: The overarching project ecosystem associated with the MeshSync protocol specifications.
* **[TeaBuddy](./teabuddy.md)**: An integration request for this entity was officially denied, as outlined in the partnership memo.

## Related Concepts
* **Parent Election**: Network topology formation using RSSI-weighted random backoff to assign parent and child roles among nodes.
* **Rejoin Storm State**: Handled via the `MESHSYNC_ROLE_LOST` state when nodes lose connectivity and attempt to reconnect.

## Contradictions
*(No contradictions present in the current source data.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt` | text | Unverified |

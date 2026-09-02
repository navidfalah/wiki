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
last_updated: "2026-09-02T06:41:58.287901+00:00"
sidebar_label: Protocols
slug: /protocols
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Protocols

## Overview
This wiki page documents protocol specifications and headers, focusing on the [MeshSync Protocol](./meshsync-protocol.md) version 0.3 header implementation (`meshsync.h`). It outlines core network limits, node roles, and state behaviors for device coordination within [Aurora Nova Widget v2](./aurora-nova-widget-v2.md)-related ecosystems.

## Key Details
The [MeshSync Protocol](./meshsync-protocol.md) header (`meshsync.h`) defines critical constants, types, and operational rules for mesh network synchronization:
- **Maximum Nodes (`MESHSYNC_MAX_NODES`)**: Set to `32`.
- **Beta Safe Nodes (`MESHSYNC_BETA_SAFE_NODES`)**: Set to `6`.
- **Default Interval (`MESHSYNC_DEFAULT_INTERVAL_MIN`)**: Set to `15` minutes (replacing the deprecated hourly interval).
- **Node Roles (`meshsync_role_t`)**:
  - `MESHSYNC_ROLE_PARENT`
  - `MESHSYNC_ROLE_CHILD`
  - `MESHSYNC_ROLE_LOST` (indicates a rejoin storm state)

## Related Entities
- **Aurora**: Associated ecosystem/context referenced in protocol tagging and development notes.
- **[TeaBuddy](./teabuddy.md)**: External entity whose integration request was formally denied per partnership memo guidelines.

## Related Concepts
- **Parent Election**: Implements an RSSI-weighted random backoff mechanism (referenced from whiteboard notes dated July 3).
- **Rejoin Storm State**: Handled via the `MESHSYNC_ROLE_LOST` role designation.

## Contradictions
*(No contradictions present in the provided source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt` | text | Unverified |

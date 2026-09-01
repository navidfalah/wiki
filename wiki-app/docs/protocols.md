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
last_updated: "2026-09-01T21:25:18.297073+00:00"
sidebar_label: Protocols
slug: /protocols
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Protocols

## Overview
This wiki page documents protocol specifications and headers, with a primary focus on the [MeshSync protocol](./meshsync-protocol.md) (v0.3) header configuration and its associated parameters, node limits, and role definitions.

## Key Details
- **Protocol Version:** MeshSync v0.3 (`meshsync.h`)
- **Node Configuration Constants:**
  - `MESHSYNC_MAX_NODES`: 32
  - `MESHSYNC_BETA_SAFE_NODES`: 6
  - `MESHSYNC_DEFAULT_INTERVAL_MIN`: 15 minutes (hourly intervals are deprecated)
- **Node Roles (`meshsync_role_t`):**
  - `MESHSYNC_ROLE_PARENT`
  - `MESHSYNC_ROLE_CHILD`
  - `MESHSYNC_ROLE_LOST` (rejoin storm state)
- **Parent Election:** Determined via RSSI-weighted random backoff (referencing the July 3 whiteboard).

## Related Entities
- **[Aurora](./nova-widget.md)**: Associated system or ecosystem referenced in the tagging and context.
- **[TeaBuddy](./teabuddy.md)**: External integration requested, though the integration request was formally denied (see partnership memo).

## Related Concepts
- **Parent Election**: The mechanism by which nodes establish hierarchy using RSSI-weighted random backoff.
- **Rejoin Storm State**: Handled via the `MESHSYNC_ROLE_LOST` role during network disruptions.

## Contradictions
*(No direct contradictions present in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt` | text | Unverified |

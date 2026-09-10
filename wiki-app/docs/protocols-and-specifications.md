---
id: protocols-and-specifications
title: Protocols and Specifications
tags:
  - aurora
  - meshsync-protocol-header
  - meshsynch
  - parent-election
  - protocols-and-specifications
  - rejoin-storm-state
  - teabuddy
  - wiki
last_updated: "2026-09-10T14:40:05.853996+00:00"
sidebar_label: Protocols and Specifications
slug: /protocols-and-specifications
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Protocols and Specifications

## Overview
This page documents the specifications and protocol headers associated with the [MeshSync](./meshsync.md) system (v0.3 excerpt), detailing network node limits, default intervals, role definitions, and background mechanisms like parent election.

## Key Details
- **File Origin:** `meshsync.h` (generated wiki test excerpt)
- **Node Limits and Intervals:**
  - `MESHSYNC_MAX_NODES`: 32
  - `MESHSYNC_BETA_SAFE_NODES`: 6
  - `MESHSYNC_DEFAULT_INTERVAL_MIN`: 15 minutes (hourly intervals are deprecated in favor of this setting).
- **Node Roles (`meshsync_role_t`):**
  - `MESHSYNC_ROLE_PARENT`
  - `MESHSYNC_ROLE_CHILD`
  - `MESHSYNC_ROLE_LOST` (represents the rejoin storm state)
- **Parent Election:** Handled via an RSSI-weighted random backoff mechanism (referenced from the whiteboard notes on July 3).
- **Integrations:** [TeaBuddy](./teabuddy.md) integration requests were officially denied, as outlined in the partnership memo.

## Related Entities
- [Aurora](./aurora-nova-widget-v2.md)
- TeaBuddy

## Related Concepts
- [MeshSync Protocol](./meshsync-protocol.md)
- Parent Election
- Rejoin Storm State

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt` | text | Unverified |

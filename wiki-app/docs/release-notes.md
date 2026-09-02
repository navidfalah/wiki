---
id: release-notes
title: Release Notes
tags:
  - aurora-labs
  - jonah-park
  - mira-chen
  - mqtt-export-schema-v2
  - parent-election-logging
  - rejoin-storm-mitigation
  - release-notes
  - sam-rivera
last_updated: "2026-09-02T06:42:03.903515+00:00"
sidebar_label: Release Notes
slug: /release-notes
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Release Notes

## Overview

This page captures the official release notes and related development details for [Aurora Labs](./aurora-labs.md)' [MeshSync](./meshsync.md) [firmware](./firmware.md) version 0.3.8, released on July 2, 2026.

## Key Details

- **Release Date:** July 2, 2026
- **Owners:** [Mira Chen](./aurora-nova-widget-v2.md) (Firmware), Jonah Park (QA Sign-off)
- **Highlights:**
  - Rejoin storm mitigation implemented for meshes exceeding 6 nodes (addressing a known issue since beta).
  - Parent election logging introduced, exporting RSSI and hop count via debug UART.
  - Power spike on rejoin reduced from 340µA to 180µA (though it remains above the 110µA target).
- **Breaking Changes:**
  - Default read interval remains **15 minutes** (clarified that kickoff slides incorrectly stated hourly).
  - [MQTT export](./mqtt-export.md) schema v2 introduced as optional, for local brokers only.
- **Known Issues:**
  - Networks with 8+ nodes remain unstable in field reports (tracked under ticket #2099).
  - [Battery life](./battery-life.md) projections differ: engineering estimates 18 months at 10 nodes, while marketing statements may still claim 2 years.
- **[TeaBuddy](./teabuddy.md) Mention:** 
  - Sam Rivera inquired about synchronizing tea timers via MeshSync, which was ruled **out of scope for Aurora v1**.

## Related Entities

- Aurora Labs
- Mira Chen
- Jonah Park
- Sam Rivera

## Related Concepts

- Rejoin Storm Mitigation
- Parent Election Logging
- MQTT Export Schema v2
- MeshSync Firmware

## Contradictions

*No direct contradictions were identified in the source [documentation](./documentation.md) for this release, though discrepancies between internal engineering estimates and external marketing claims regarding battery life are noted.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-02-aurora-meshsync-release-notes.md` | text | Unverified |

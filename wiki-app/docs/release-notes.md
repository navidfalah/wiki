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
last_updated: "2026-09-01T19:21:17.996605+00:00"
sidebar_label: Release Notes
slug: /release-notes
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Release Notes

## Overview
This wiki page documents the release notes for the MeshSync [firmware](./firmware.md) version 0.3.8 by [Aurora Labs](./aurora-labs.md), detailing highlights, breaking changes, known issues, and team mentions from the 2026-07-02 release.

## Key Details
- **Release Date:** July 2, 2026
- **Highlights:**
  - Rejoin storm mitigation implemented for meshes exceeding 6 nodes (addressing a known issue since beta).
  - Parent election logging introduced, exporting RSSI and hop count via debug UART.
  - Power spike on rejoin reduced from 340µA to 180µA (though this remains above the 110µA target).
- **Breaking Changes & Configurations:**
  - Default read interval is set to **15 minutes** (clarifying that kickoff slides incorrectly stated it was hourly).
  - Introduction of [MQTT export](./mqtt-export.md) schema v2 (optional, restricted to local broker only).
- **Known Issues:**
  - Networks with 8+ nodes remain unstable in field reports (tracked under ticket #2099).
  - [Battery life](./battery-life.md) expectations differ: engineering estimates 18 months at 10 nodes, while marketing may still promote a 2-year lifespan.

## Related Entities
- **Aurora Labs:** The organization behind the MeshSync firmware and Aurora v1.
- **[Mira Chen](./aurora-labs.md):** Firmware owner.
- **Jonah Park:** QA sign-off owner.
- **Sam Rivera:** Inquired about syncing tea timers.

## Related Concepts
- **MeshSync Firmware 0.3.8:** The specific firmware version covered in these release notes.
- **Rejoin Storm Mitigation:** Mechanism to handle mesh reconnections when node counts exceed 6.
- **Parent Election Logging:** Debug feature exporting RSSI and hop count via UART.
- **MQTT Export Schema v2:** Optional schema for local broker data export.

## Contradictions
*(No explicit contradictions found within the provided source data, though discrepancies between engineering estimates and marketing claims regarding battery life are noted.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-02-aurora-meshsync-release-notes.md` | text | Unverified |

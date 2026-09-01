---
id: firmware-releases
title: Firmware Releases
tags:
  - aurora-labs
  - firmware-releases
  - jonah-park
  - mira-chen
  - mqtt-export-schema-v2
  - parent-election-logging
  - rejoin-storm-mitigation
  - sam-rivera
last_updated: "2026-09-01T19:18:41.665614+00:00"
sidebar_label: Firmware Releases
slug: /firmware-releases
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Releases

## Overview
This wiki page covers details regarding [firmware](./firmware.md) releases from [Aurora Labs](./aurora-labs.md), focusing specifically on the MeshSync firmware version 0.3.8 released on July 2, 2026.

## Key Details
- **Release Date:** 2026-07-02
- **Owners:** [Mira Chen](./aurora-labs.md) (firmware), Jonah Park (QA sign-off)
- **Highlights:**
  - Rejoin storm mitigation implemented when the mesh exceeds 6 nodes (addressing a known issue since beta).
  - Parent election logging now exports RSSI and hop count via debug UART.
  - Power spike on rejoin has been reduced from 340µA to 180µA, though it remains above the 110µA target.
- **Breaking Changes:**
  - The default read interval remains **15 minutes** (clarified that kickoff slides incorrectly stated it would be hourly).
  - Introduction of [MQTT export](./mqtt-export.md) schema v2 (optional, local broker only).
- **Known Issues:**
  - Networks with 8+ nodes remain unstable in field reports (tracked in ticket #2099).
  - [Battery life](./battery-life.md) projections differ: engineering estimates 18 months at 10 nodes, while marketing may still promote 2 years.
- **Other Notes:**
  - Sam Rivera inquired about syncing tea timers using MeshSync, which was confirmed to be **out of scope for Aurora v1**.

## Related Entities
- Aurora Labs
- Mira Chen
- Jonah Park
- Sam Rivera
- [Nova Widget](./nova-widget.md)

## Related Concepts
- Rejoin storm mitigation
- Parent election logging
- MQTT export schema v2
- Battery life optimization

## Contradictions
&gt; **Contradiction:** Kickoff slides incorrectly claimed that the default read interval would be hourly, whereas the actual release maintains a default read interval of 15 minutes. Additionally, there is a discrepancy in battery life projections where engineering estimates 18 months at 10 nodes while marketing claims 2 years.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-02-aurora-meshsync-release-notes.md` | text | Unverified |

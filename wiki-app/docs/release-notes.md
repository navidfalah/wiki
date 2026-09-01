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
last_updated: "2026-09-01T21:25:23.596858+00:00"
sidebar_label: Release Notes
slug: /release-notes
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Release Notes

## Overview
This wiki page documents the release notes for the [MeshSync](./meshsync.md) [firmware](./firmware.md) version 0.3.8 by [Aurora Labs](./aurora-labs.md), detailing firmware highlights, breaking changes, known issues, and project side notes.

## Key Details
- **Release Date:** 2026-07-02
- **Firmware Version:** 0.3.8
- **Rejoin Storm Mitigation:** Implemented to address issues when the mesh exceeds 6 nodes (a known issue since the [beta testing](./beta-testing.md) phase).
- **Parent Election Logging:** RSSI and hop count are now exported via debug UART.
- **Power Optimization:** Power spike on rejoin was reduced from 340µA to 180µA, though this remains above the 110µA target.
- **Read Interval:** The default read interval remains **15 minutes** (clarified that kickoff slides incorrectly stated it was hourly).
- **[MQTT Export](./mqtt-export.md):** Introduces MQTT export schema v2 as an optional feature restricted to the local broker only.

## Related Entities
- **Aurora Labs**
- **[Mira Chen](./nova-widget.md)** (Firmware Owner)
- **Jonah Park** (QA Sign-off)
- **Sam Rivera** (Inquired about [TeaBuddy](./teabuddy.md) integration)

## Related Concepts
- MeshSync firmware
- [Nova Widget](./nova-widget.md)
- Rejoin storm mitigation
- Parent election logging
- Power spike reduction
- MQTT export schema v2

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding [battery life](./battery-life.md) expectations. Engineering estimates a battery life of 18 months at 10 nodes, while marketing may still promote a 2-year lifespan.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-02-aurora-meshsync-release-notes.md` | text | Unverified |

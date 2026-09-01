---
id: firmware-issues
title: Firmware Issues
tags:
  - aurora-labs
  - firmware-issues
  - jonah-park
  - mesh-118
  - meshsync-relay-mode
  - mira-chen
  - read-interval
  - wiki
last_updated: "2026-09-01T19:18:39.718641+00:00"
sidebar_label: Firmware Issues
slug: /firmware-issues
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Issues

## Overview
Field units in batch 4 are experiencing notable [battery drain](./battery-drain.md) anomalies related to [firmware](./firmware.md) configuration and radio management when using MeshSync relay mode.

## Key Details
- **Battery Drain:** Batch 4 field units report battery drain approximately 30% faster than specification once MeshSync relay mode is enabled.
- **Read Interval:** The read interval is configured to 15 minutes, which matches the current firmware default (version 0.3.8), ruling out an interval misconfiguration.
- **Root Cause Suspect:** The engineering team suspects that the relay radio is failing to sleep between hops and is instead staying awake continuously.
- **Tracking Ticket:** Filed under tracking ID `[MESH-118](./mesh-118.md)`.

## Related Entities
- **[Mira Chen](./aurora-labs.md):** Author of the field report and engineering communicator (`mira.chen@auroralabs.example`).
- **Jonah Park:** CC'd recipient on the engineering communication (`jonah.park@auroralabs.example`).
- **[Aurora Labs](./aurora-labs.md):** Organization managing the engineering team and field units.

## Related Concepts
- **MeshSync Relay Mode:** A communication mode for mesh networks that, when enabled, currently triggers accelerated battery depletion in batch 4 [hardware](./hardware.md).
- **Firmware Version 0.3.8:** The current firmware default establishing the 15-minute read interval.

## Contradictions
*(No contradictions reported in current sources)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-02-meshsync-battery-report.eml` | email | Medium |

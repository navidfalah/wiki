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
last_updated: "2026-09-01T21:22:48.334270+00:00"
sidebar_label: Firmware Issues
slug: /firmware-issues
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Issues

## Overview
Field units in Batch 4 have been experiencing unexpected [battery drain](./battery-drain.md) issues related to [firmware](./firmware.md) behavior when [MeshSync](./meshsync.md) relay mode is enabled. The problem was identified and reported by Mira Chen to the engineering team.

## Key Details
- **Symptom:** Batch 4 field units report battery drain approximately 30% faster than specifications.
- **Trigger:** Occurs once MeshSync relay mode is enabled.
- **Configuration:** The read interval is set to 15 minutes, matching the current firmware default (0.3.8), ruling out an interval misconfiguration.
- **Suspected Cause:** The relay radio is suspected of staying awake continuously between hops instead of entering a sleep state.
- **Tracking:** Filed under issue tracker ID **[MESH-118](./mesh-118.md)**.

## Related Entities
- **Mira Chen:** Author of the field report and reporter of the issue.
- **Jonah Park:** CC'd on the engineering communication regarding the battery drain.
- **[Aurora Labs](./aurora-labs.md):** Organization overseeing the engineering team and field units.

## Related Concepts
- **MeshSync Relay Mode:** A mode of operation for [mesh networking](./mesh-networking.md) that, in firmware version 0.3.8, is currently linked to abnormal [power consumption](./power-consumption.md).
- **Read Interval:** The scheduled frequency of data reads (currently configured at the 15-minute default).
- **Battery Drain:** The accelerated power depletion observed in the field units.

## Contradictions
*(No contradictions noted in the current source data.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-02-meshsync-battery-report.eml` | email | Medium |

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
last_updated: "2026-09-02T06:39:27.433476+00:00"
sidebar_label: Firmware Issues
slug: /firmware-issues
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Issues

## Overview
Field units in Batch 4 have been experiencing unexpected [battery drain](./battery-drain.md) issues related to [firmware](./firmware.md) behavior when running [MeshSync](./meshsync.md) relay mode. The problem was identified and reported by [Mira Chen](./aurora-nova-widget-v2.md) to the engineering team.

## Key Details
- **Symptom:** Battery drain is occurring roughly 30% faster than specification once MeshSync relay mode is enabled.
- **Configuration:** The read interval is correctly set to 15 minutes in accordance with the current firmware default (version 0.3.8), ruling out any interval misconfiguration.
- **Root Cause Suspicion:** Engineers suspect that the relay radio is failing to sleep between hops, causing it to stay awake continuously.
- **Tracking:** The issue has been officially filed in the tracking system as **[MESH-118](./mesh-118.md)**.

## Related Entities
- **Mira Chen:** Author of the field report detailing the battery drain issue (`mira.chen@auroralabs.example`).
- **Jonah Park:** CC'd on the engineering team report regarding Batch 4 units (`jonah.park@auroralabs.example`).
- **[Aurora Labs](./aurora-labs.md):** The organization managing the field units and engineering team (`auroralabs.example`).

## Related Concepts
- **MeshSync Relay Mode:** A mode of operation that, when enabled, currently triggers excessive battery consumption in Batch 4 field units.
- **Read Interval:** The configured polling frequency, currently set to the 0.3.8 firmware default of 15 minutes.
- **Radio Sleep State:** The power-saving state that the relay radio is suspected of failing to enter between communication hops.

## Contradictions
*(No contradictions present in current sources)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-02-meshsync-battery-report.eml` | email | Medium |

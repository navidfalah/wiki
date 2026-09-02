---
id: battery-drain
title: Battery Drain
tags:
  - aurora-labs
  - battery-drain
  - jonah-park
  - mesh-118
  - meshsync-relay-mode
  - mira-chen
  - read-interval
  - wiki
last_updated: "2026-09-02T06:38:40.364985+00:00"
sidebar_label: Battery Drain
slug: /battery-drain
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Battery Drain

## Overview
Field reports from batch 4 units indicate an unexpected and accelerated battery consumption issue occurring when [MeshSync](./meshsync.md) relay mode is enabled. The affected devices are draining their batteries approximately 30% faster than specified in the [hardware](./hardware.md) guidelines.

## Key Details
- **Issue Tracker ID:** [MESH-118](./mesh-118.md)
- **Severity / Impact:** Battery drain is running ~30% faster than spec.
- **Configuration Status:** Read interval is correctly configured to 15 minutes, matching the current [firmware](./firmware.md) default (version 0.3.8), ruling out any interval misconfigurations.
- **Root Cause Suspect:** The engineering team suspects that the relay radio is failing to enter sleep mode between hops, remaining continuously awake instead.

## Related Entities
- **Mira Chen:** Author of the field report and engineering communicator (`mira.chen@auroralabs.example`).
- **Jonah Park:** Copied stakeholder on the field report (`jonah.park@auroralabs.example`).
- **[Aurora Labs](./aurora-labs.md):** The organization managing the engineering team and field units.

## Related Concepts
- **MeshSync Relay Mode:** A [networking](./networking.md) operational mode that, when enabled, currently triggers the accelerated [power consumption](./power-consumption.md) bug.
- **Firmware Default (0.3.8):** The baseline firmware version under test, establishing the 15-minute read interval.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-02-meshsync-battery-report.eml` | email | Medium |

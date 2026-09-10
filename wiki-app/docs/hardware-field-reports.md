---
id: hardware-field-reports
title: Hardware Field Reports
tags:
  - aurora-labs
  - hardware-field-reports
  - jonah-park
  - mesh-118
  - meshsync-relay-mode
  - mira-chen
  - read-interval
  - wiki
last_updated: "2026-09-10T14:38:28.428881+00:00"
sidebar_label: Hardware Field Reports
slug: /hardware-field-reports
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Field Reports

## Overview
This wiki page documents incoming [hardware](./hardware.md) field reports, anomalies, and [battery drain](./battery-drain.md) investigations affecting deployment units at [Aurora Labs](./aurora-labs.md).

## Key Details
- **Batch 4 Field Units:** Reporting a battery drain approximately 30% faster than specification once [MeshSync](./meshsync.md) relay mode is enabled.
- **Read Interval:** Configured to 15 minutes, matching the current [firmware](./firmware.md) default (0.3.8), ruling out any interval misconfiguration.
- **Suspected Root Cause:** The relay radio is suspected of staying awake continuously between hops rather than entering sleep mode.
- **Tracking:** Filed under issue identifier `MESH-118`.

## Related Entities
- **[Mira Chen](./aurora-nova-widget-v2.md):** Author of the field report and engineering team member who identified the battery drain anomaly.
- **Jonah Park:** Copied on the field report correspondence.
- **Aurora Labs:** The organization managing the engineering and deployment of the units.

## Related Concepts
- **MeshSync Relay Mode:** A device operating mode that, when enabled, currently triggers accelerated battery depletion in Batch 4 hardware.
- **Firmware Default (0.3.8):** The baseline firmware version under which the field tests and read intervals (15 minutes) were evaluated.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/ideas/emails/2026-06-02-meshsync-battery-report.eml` | email | Medium |

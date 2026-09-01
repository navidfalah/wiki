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
last_updated: "2026-09-01T21:22:02.446310+00:00"
sidebar_label: Battery Drain
slug: /battery-drain
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Battery Drain

## Overview
Field reports for [Aurora Labs](./aurora-labs.md) Batch 4 units indicate significant battery drain issues occurring when [MeshSync](./meshsync.md) relay mode is enabled. Devices are depleting their batteries approximately 30% faster than specification.

## Key Details
- **Impact:** Batch 4 field units experience 30% faster battery drain than specified limits.
- **Trigger:** Issue manifests specifically when MeshSync relay mode is enabled.
- **Configuration:** Read interval is confirmed at 15 minutes, matching the [firmware](./firmware.md) default (0.3.8), ruling out any interval misconfigurations.
- **Root Cause Hypothesis:** The relay radio is suspected to stay awake between hops instead of entering a sleep state.
- **Tracking:** Filed under ticket **[MESH-118](./mesh-118.md)**.

## Related Entities
- **[Mira Chen](./nova-widget.md):** Author of the field report (mira.chen@[auroralabs](./nova-widget.md).example).
- **Jonah Park:** Copied on the field report (jonah.park@auroralabs.example).
- **Aurora Labs:** Organization managing the [hardware](./hardware.md) and firmware deployment.
- **Batch 4 Units:** The specific hardware batch impacted by the issue.

## Related Concepts
- **MeshSync Relay Mode:** Operating mode that appears to prevent the radio from sleeping properly between transmission hops.
- **Read Interval:** Configured telemetry/polling interval (defaulted to 15 minutes in firmware version 0.3.8).
- **Firmware 0.3.8:** The current firmware version running on the affected units.

## Contradictions
*No contradictions reported in the current sources.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-02-meshsync-battery-report.eml` | email | Medium |

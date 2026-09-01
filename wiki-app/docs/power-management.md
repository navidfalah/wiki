---
id: power-management
title: Power Management
tags:
  - aurora-nova-widget-v2
  - jonah-park
  - meshsync
  - mira-chen
  - parent-election
  - power-budget
  - power-management
  - sensenode-sn-400
last_updated: "2026-09-01T21:24:41.169227+00:00"
sidebar_label: Power Management
slug: /power-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Power Management

## Overview
Power management for the [Aurora Nova Widget v2 beta](./nova-widget.md) unit governs energy consumption across sleep, sampling, transmission, and network rejoin states. The device operates as an open-source soil moisture and temperature sensor utilizing [MeshSync](./meshsync.md) local mesh communication without mandatory cloud dependency.

## Key Details
The current [power budget](./power-budget.md) for the [Aurora Nova Widget v2](./aurora-nova-widget-v2.md) is outlined as follows:

| Mode | Current | Notes |
|------|---------|-------|
| Sleep | 4.2 µA | Target |
| Sample + TX | 12 mA peak | 15-minute interval |
| Rejoin spike | **110–340 µA** | Known issue |

- **Battery Configuration:** Dual CR2032 batteries ($\text&#123;CR2032&#125; \times 2$).
- **[Battery Life](./battery-life.md) Expectations:** Marketing materials claim a 2-year lifespan, whereas engineering projections estimate 18 months at a density of 10 nodes.

## Related Entities
- **Aurora Nova Widget v2:** The open-source soil moisture and temperature sensor beta unit utilizing this power budget.
- **[Mira Chen](./nova-widget.md):** [Firmware](./firmware.md) owner for the device.
- **Jonah Park:** [Hardware](./hardware.md) owner for the device.
- **[SenseNode SN-400](./sensenode-sn-400.md):** Competitor product referenced for comparison.

## Related Concepts
- **MeshSync:** Local [mesh networking](./mesh-networking.md) protocol used by the widget (supports a theoretical maximum of 32 nodes, though [beta testing](./beta-testing.md) has proven unstable at 8 nodes).
- **Parent Election:** Network routing mechanism currently pending formal specification (noted as "???" on the project whiteboard).

## Contradictions
*(No direct contradictions present in the current source material, though a discrepancy exists between marketing and engineering regarding battery lifespan projections.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |

---
id: power-management
title: Power Management
tags:
  - aurora-nova-widget-v2
  - jonah-park
  - mira-chen
  - power-budget
  - power-management
  - sensenode-sn-400
last_updated: "2026-09-10T14:39:42.377166+00:00"
sidebar_label: Power Management
slug: /power-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Power Management

## Overview

Power management is a critical subsystem of the [Aurora Nova Widget v2 beta](./aurora-nova-widget-v2.md) unit, an open-source soil moisture and temperature sensor utilizing the [MeshSync](./meshsync.md) local mesh protocol without mandatory cloud dependence.  While [marketing](./marketing.md) materials claim a 2-year [Battery Life](./battery-life.md), engineering estimates project a maximum life of 18 months assuming a 10-node deployment.

## Key Details

The current [Power Budget](./power-budget.md) for the Aurora Nova Widget v2 beta unit is outlined as follows:

| Mode | Current | Notes |
|------|---------|-------|
| Sleep | 4.2 µA | Target |
| Sample + TX | 12 mA peak | 15 min interval |
| Rejoin spike | **110–340 µA** | Known issue |

## Related Entities

- **Aurora Nova Widget v2:** The open-source soil moisture and temperature sensor hosting this power [configuration](./configuration.md).
- **[Mira Chen](./aurora-nova-widget-v2.md):** [Firmware](./firmware.md) owner for the widget.
- **Jonah Park:** [Hardware](./hardware.md) owner for the widget.
- **[SenseNode SN-400](./sensenode-sn-400.md):** Competitor product referenced in cross-links.

## Related Concepts

- **MeshSync:** The local [Mesh Networking](./mesh-networking.md) protocol used by the widget (supporting a theoretical maximum of 32 nodes, though [Beta Testing](./beta-testing.md) has been unstable at 8 nodes).
- **Parent Election:** A network formation process whose mechanism is currently undetermined ("??? (see whiteboard)").
- **Power Budget:** The planning document and metric tracking for current draw across sleep, sampling, and rejoin states.

## Contradictions

&gt; **Contradiction:** There is a discrepancy in projected battery longevity between departments. Marketing claims a 2-year battery life for the dual CR2032 setup, whereas engineering estimates limit the lifespan to 18 months at a 10-node scale.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |

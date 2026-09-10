---
id: power-consumption
title: Power Consumption
tags:
  - aurora
  - duty-cycle-limits
  - mira-chen
  - power-consumption
  - rejoin-spikes
  - sensenode
  - total-cost-of-ownership-tco
  - wiki
last_updated: "2026-09-10T14:39:40.216041+00:00"
sidebar_label: Power Consumption
slug: /power-consumption
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Power Consumption

## Overview
This page documents the power consumption comparison between [LoRaWAN](./lorawan.md) (using [SenseNode](./sensenode.md)-class devices) and [MeshSync](./meshsync.md) (using [Aurora](./aurora-nova-widget-v2.md)) based on research conducted by [Mira Chen](./aurora-nova-widget-v2.md) on July 6, 2026. The baseline assumptions evaluate a network consisting of 10 sensor nodes and one gateway with a 15-minute sample interval.

## Key Details
- **LoRaWAN (SenseNode-class):**
  - Subject to duty cycle limits in the EU, which necessitate a longer effective interval or higher peak power.
  - The gateway requires an always-on power draw of approximately 2W wall power.
- **MeshSync (Aurora):**
  - Powered by a CR2032 battery per node.
  - Rejoin spikes significantly impact power efficiency at scale; although [firmware](./firmware.md) version 0.3.8 improved this issue, it is not completely solved.
- **Total Cost of Ownership (TCO) Conclusion:**
  - MeshSync wins on TCO due to the absence of a subscription and the elimination of the gateway wall wart.

## Related Entities
- **Mira Chen** (Research Author)
- **SenseNode** (LoRaWAN class [hardware](./hardware.md))
- **Aurora** (MeshSync hardware platform)

## Related Concepts
- **LoRaWAN**
- **MeshSync**
- **Duty Cycle Limits**
- **Rejoin Spikes**
- **Total Cost of Ownership (TCO)**

## Contradictions
&gt; **Contradiction:** An old research tab bookmark claimed that mesh networks always have lower power consumption, which is **false at 8+ nodes today**.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |

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
last_updated: "2026-09-01T19:20:35.232733+00:00"
sidebar_label: Power Consumption
slug: /power-consumption
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Power Consumption

## Overview
This wiki page covers the comparative power consumption analysis between [LoRaWAN](./lorawan.md) and MeshSync technologies, based on research conducted by Mira Chen on July 6, 2026. The evaluation is based on a baseline scenario of 10 sensor nodes, one gateway, and a 15-minute sample interval.

## Key Details
- **LoRaWAN ([SenseNode](./sensenode-sn-400.md)-class):** 
  - Subject to duty cycle limits in the EU, which results in a longer effective interval or higher peak power requirements.
  - The gateway is always-on and consumes approximately 2W of wall power.
- **MeshSync (Aurora):** 
  - Each node is powered by a CR2032 coin cell battery.
  - Rejoin spikes negatively impact efficiency at scale; [firmware](./firmware.md) version 0.3.8 made improvements, but the issue remains unsolved.
- **Total Cost of Ownership (TCO) & Conclusion:** 
  - Mesh wins on TCO due to having no subscription fees and eliminating the need for a gateway wall wart.

## Related Entities
- **Mira Chen:** Author of the LoRaWAN vs MeshSync power comparison research.
- **SenseNode:** Represents the LoRaWAN-class sensor node [hardware](./hardware.md) used in the comparison.
- **Aurora:** Represents the MeshSync-class hardware utilizing CR2032 batteries.

## Related Concepts
- **Duty Cycle Limits:** Regulatory restrictions in the EU affecting LoRaWAN transmission frequencies and power usage.
- **Rejoin Spikes:** Network events in MeshSync systems that cause surges in power consumption as nodes reconnect at scale.
- **Total Cost of Ownership (TCO):** Financial evaluation metric where MeshSync holds an advantage due to the absence of subscriptions and wall power requirements.

## Contradictions
&gt; **Contradiction:** An old research tab bookmark stated that mesh networks always exhibit lower power consumption, which is **false at 8+ nodes today**.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |

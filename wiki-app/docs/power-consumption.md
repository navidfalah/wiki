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
last_updated: "2026-09-02T06:41:21.625996+00:00"
sidebar_label: Power Consumption
slug: /power-consumption
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Power Consumption

## Overview
This page documents the power consumption analysis comparing [LoRaWAN](./lorawan.md) and [MeshSync](./meshsync.md) technologies, based on research conducted by Mira Chen in July 2026. The evaluation considers a baseline deployment of 10 [Sensors](./sensors.md) nodes and one gateway operating at a 15-minute sample interval.

## Key Details
- **Test Baseline:** 10 sensor nodes, 1 gateway, with a 15-minute sample interval.
- **LoRaWAN ([SenseNode SN-400](./sensenode-sn-400.md)-class):** 
  - Subject to duty cycle limits in the EU, resulting in a longer effective interval or higher peak power requirements.
  - Gateway is always-on, consuming approximately 2W of wall power.
- **MeshSync (Aurora):** 
  - Powered by a CR2032 coin cell [Battery Specifications](./battery-specifications.md) per node.
  - Rejoin spikes negatively impact [Power Management](./power-management.md) efficiency at scale; version 0.3.8 improved this issue but did not completely solve it.
- **Conclusion Slide Draft:** "Mesh wins on TCO without subscription + no gateway wall wart"

## Related Entities
- [Mira Chen](mira-chen)
- [SenseNode](sensenode)
- [Aurora](aurora)

## Related Concepts
- [Duty Cycle Limits](duty-cycle-limits)
- [Rejoin Spikes](rejoin-spikes)
- [Total Cost of Ownership (TCO)](total-cost-of-ownership-tco)

## Contradictions
&gt; **Contradiction:** An old research tab bookmark claimed that mesh networks always exhibit lower power consumption; however, this is **false at 8+ nodes today**.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |

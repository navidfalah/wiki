---
id: hardware-research
title: "Hardware Research: LoRaWAN vs MeshSync Power Comparison"
tags:
  - aurora
  - duty-cycle-limits
  - hardware-research
  - mira-chen
  - rejoin-spikes
  - sensenode
  - total-cost-of-ownership-tco
  - wiki
last_updated: "2026-09-01T19:19:03.497560+00:00"
sidebar_label: "Hardware Research: LoRaWAN vs MeshSync Power Comparison"
slug: /hardware-research
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Research: LoRaWAN vs MeshSync Power Comparison

## Overview
This research evaluates the [power consumption](./power-consumption.md) and operational feasibility of a network consisting of 10 sensor nodes and one gateway, comparing [LoRaWAN](./lorawan.md) ([SenseNode SN-400](./sensenode-sn-400.md)-class) against MeshSync ([Aurora Labs](./aurora-labs.md)) architectures based on a 15-minute sample interval.

## Key Details
- **Test Configuration:** 10 sensor nodes, 1 gateway, 15-minute sample interval.
- **LoRaWAN (SenseNode-class):** 
  - Subject to EU duty cycle limits, which result in longer effective intervals or higher peak power requirements.
  - Requires an always-on gateway consuming approximately 2W of wall power.
- **MeshSync (Aurora):** 
  - Utilizes a CR2032 coin cell battery per node.
  - Rejoin spikes negatively impact efficiency at scale (version 0.3.8 made improvements, but the issue is not fully solved).
- **Conclusion Draft:** Mesh architecture wins on Total Cost of Ownership (TCO) due to having no subscription fees and eliminating the need for a gateway wall wart.

## Related Entities
- **[Mira Chen](./aurora-labs.md):** Author of the [hardware](./hardware.md) research.
- **SenseNode:** Class of hardware used for the LoRaWAN evaluation.
- **Aurora:** Hardware platform utilizing MeshSync.

## Related Concepts
- **Duty Cycle Limits:** Regulatory constraints in the EU affecting LoRaWAN transmission frequencies and power.
- **Rejoin Spikes:** Power-intensive reconnection events that impact MeshSync node batteries at scale.
- **Total Cost of Ownership (TCO):** Financial metric favoring MeshSync due to zero subscription costs and power supply savings.

## Contradictions
&gt; **Contradiction:** An old research tab bookmark asserted that mesh architecture is always lower power. This is false for networks of 8+ nodes under current conditions.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |

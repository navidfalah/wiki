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
last_updated: "2026-09-10T14:38:30.251970+00:00"
sidebar_label: "Hardware Research: LoRaWAN vs MeshSync Power Comparison"
slug: /hardware-research
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Research: LoRaWAN vs MeshSync Power Comparison

## Overview
This research evaluates the [power consumption](./power-consumption.md) and operational viability of [LoRaWAN](./lorawan.md) ([SenseNode](./sensenode.md)-class) versus [MeshSync](./meshsync.md) ([Aurora Nova Widget v2](./aurora-nova-widget-v2.md)) architectures. The study assumes a network setup consisting of 10 sensor nodes and one gateway, operating on a 15-minute sample interval.

## Key Details
- **Test [Configuration](./configuration.md):** 10 sensor nodes, 1 gateway, and a 15-minute sample interval.
- **LoRaWAN (SenseNode-class):** 
  - Subject to duty cycle limits in the EU, which results in either a longer effective interval or higher peak power usage.
  - Features a gateway that remains always-on, drawing approximately 2W of wall power.
- **MeshSync (Aurora):** 
  - Utilizes a CR2032 coin cell battery per node.
  - Suffers from rejoin spikes that negatively impact efficiency at scale; [firmware](./firmware.md) version 0.3.8 improved this issue but did not completely solve it.
- **Conclusion Slide Draft:** "Mesh wins on TCO without subscription + no gateway wall wart"

## Related Entities
- **[Mira Chen](./aurora-nova-widget-v2.md):** Author of the research.
- **SenseNode:** Representative class for the LoRaWAN [hardware evaluation](./hardware-evaluation.md).
- **Aurora:** The hardware platform evaluated for MeshSync.

## Related Concepts
- **Duty Cycle Limits:** Regulatory constraints in the EU affecting LoRaWAN transmission frequencies and power profiles.
- **Rejoin Spikes:** Power surges experienced by mesh nodes when reconnecting to the network, impacting battery longevity at scale.
- **Total Cost of Ownership (TCO):** Evaluated metric favoring mesh due to the absence of subscriptions and gateway wall power requirements.

## Contradictions
&gt; **Contradiction:** An old research tab bookmark claimed that mesh is always lower power. This is false for networks of 8+ nodes under current conditions.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |

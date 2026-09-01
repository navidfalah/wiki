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
last_updated: "2026-09-01T21:23:11.674983+00:00"
sidebar_label: "Hardware Research: LoRaWAN vs MeshSync Power Comparison"
slug: /hardware-research
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Research: LoRaWAN vs MeshSync Power Comparison

## Overview
This research, authored by [Mira Chen](./nova-widget.md) on July 6, 2026, provides a rough power and architectural comparison between [LoRaWAN](./lorawan.md) (using [SenseNode SN-400](./sensenode-sn-400.md)-class [Hardware](./hardware.md)) and [MeshSync](./meshsync.md) (using [Aurora Nova Widget](./nova-widget.md) hardware). The evaluation models a network setup consisting of 10 sensor nodes and one gateway, operating on a 15-minute sample interval.

## Key Details
- **Test Architecture:** 10 sensor nodes and 1 gateway.
- **Sample Interval:** 15 minutes.
- **LoRaWAN (SenseNode-class):** 
  - Subject to duty cycle limits in the EU, which results in either a longer effective interval or higher peak power usage.
  - The gateway requires continuous wall power, running at approximately 2W always-on.
- **MeshSync (Aurora):** 
  - Powered by CR2032 coin cell batteries per node.
  - Rejoin spikes negatively impact efficiency at scale ([Firmware](./firmware.md) version 0.3.8 improved this issue, but did not completely solve it).
- **Conclusion Slide Draft:** "Mesh wins on TCO without subscription + no gateway wall wart"

## Related Entities
- **Mira Chen:** Author of the hardware research.
- **SenseNode:** Class of hardware used for the LoRaWAN evaluation.
- **Aurora:** Hardware platform used for the MeshSync evaluation.

## Related Concepts
- **Duty Cycle Limits:** Regulatory constraints in the EU affecting LoRaWAN transmission frequencies and power profiles.
- **Rejoin Spikes:** Network re-establishment events that drain power on mesh nodes, affecting scalability.
- **Total Cost of Ownership (TCO):** Financial metric favoring MeshSync due to the absence of subscriptions and gateway power overhead.

## Contradictions
&gt; **Contradiction:** An old research tab bookmark previously claimed that mesh configurations always have lower [Power Consumption](./power-consumption.md). This is **false at 8+ nodes today**.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |

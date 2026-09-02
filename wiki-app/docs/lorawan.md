---
id: lorawan
title: LoRaWAN
tags:
  - aurra
  - duty-cycle-limits
  - lorawan
  - mira-chen
  - rejoin-spikes
  - sensenode
  - total-cost-of-ownership-tco
  - wiki
last_updated: "2026-09-02T06:40:34.915278+00:00"
sidebar_label: LoRaWAN
slug: /lorawan
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# LoRaWAN

## Overview
This wiki page synthesizes research comparing the [power consumption](./power-consumption.md) and operational characteristics of LoRaWAN (utilizing [SenseNode SN-400](./sensenode-sn-400.md)-class [hardware](./hardware.md)) against [MeshSync](./meshsync.md) ([Aurora Nova Widget v2](./aurora-nova-widget-v2.md)) network architectures, based on a 10-sensor node deployment with a 15-minute sample interval.

## Key Details
- **Deployment Assumptions:** Evaluates 10 sensor nodes communicating with a single gateway at a 15-minute sample interval.
- **LoRaWAN (SenseNode-class):** 
  - Subject to duty cycle limits in the EU, which necessitate longer effective intervals or higher peak power consumption.
  - Requires a gateway that is always on, drawing approximately 2W of wall power.
- **MeshSync (Aurora):** 
  - Utilizes CR2032 coin cell batteries per node.
  - Affected by rejoin spikes that hurt performance at scale; version 0.3.8 improved this issue but did not completely solve it.
- **Total Cost of Ownership (TCO):** Mesh architectures are concluded to win on TCO due to the lack of subscription fees and the absence of a gateway wall wart.

## Related Entities
- **[Mira Chen](./aurora-nova-widget-v2.md):** Author of the comparative research.
- **SenseNode:** Class of hardware used for the LoRaWAN evaluation.
- **Aurora:** Network system utilizing MeshSync.

## Related Concepts
- **Duty Cycle Limits:** Regulatory constraints in regions like the EU that impact LoRaWAN transmission intervals and power scaling.
- **Rejoin Spikes:** Network events in mesh topologies that negatively impact [battery life](./battery-life.md) and performance at scale.
- **Total Cost of Ownership (TCO):** The comprehensive financial evaluation favoring subscription-free, gateway-free mesh topologies in this comparison.

## Contradictions
&gt; **Contradiction:** An old research tab bookmark asserted that mesh networks always feature lower power consumption than LoRaWAN. However, current research proves this claim to be false at scales of 8 or more nodes today.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |

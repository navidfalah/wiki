---
id: power-consumption
title: Power Consumption
tags:
  - aurora
  - duty-cale-limits
  - mira-chen
  - power-consumption
  - rejoin-spikes
  - sensenode
  - total-cost-of-ownership-tco
  - wiki
last_updated: "2026-09-01T21:24:39.486043+00:00"
sidebar_label: Power Consumption
slug: /power-consumption
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Power Consumption

## Overview
This document examines power consumption comparisons between [LoRaWAN](./lorawan.md) and [MeshSync](./meshsync.md) technologies, based on research by [Mira Chen](./nova-widget.md) conducted on July 6, 2026. The evaluation is based on a baseline scenario involving 10 sensor nodes, one gateway, and a 15-minute sample interval.

## Key Details
- **LoRaWAN ([SenseNode](./sensenode-sn-400.md)-class):**
  - Affected by duty cycle limits in the EU, which necessitate either a longer effective interval or higher peak power.
  - The gateway operates as an always-on device requiring approximately 2W of wall power.
- **MeshSync ([Aurora](./nova-widget.md)):**
  - Each node is powered by a CR2032 coin cell battery.
  - Rejoin spikes negatively impact efficiency at scale; although version 0.3.8 made improvements, the issue is not entirely solved.
- **Conclusion Draft:**
  - Mesh wins on Total Cost of Ownership (TCO) due to the absence of a subscription fee and the lack of a gateway wall wart.

## Related Entities
- **Mira Chen** (Author of the LoRaWAN vs MeshSync power comparison research)
- **SenseNode** (Class of devices representing LoRaWAN sensor nodes)
- **Aurora** (MeshSync technology platform utilizing CR2032-powered nodes)

## Related Concepts
- **Duty Cycle Limits** (Regulatory constraints impacting LoRaWAN transmission frequency and power)
- **Rejoin Spikes** (Power consumption surges during network reconnection in MeshSync systems)
- **Total Cost of Ownership (TCO)** (Financial metric favoring MeshSync due to subscription and [hardware](./hardware.md) power savings)

## Contradictions
&gt; **Contradiction:** An old research tab bookmark previously claimed that mesh networks always consume lower power, which is proven false at scale (8+ nodes) under current conditions.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |

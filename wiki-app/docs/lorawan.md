---
id: lorawan
title: LoRaWAN
tags:
  - aurora
  - duty-cycle-limits
  - lorawan
  - mira-chen
  - rejoin-spikes
  - sensenode
  - total-cost-of-ownership-tco
  - wiki
last_updated: "2026-09-01T21:23:55.321287+00:00"
sidebar_label: LoRaWAN
slug: /lorawan
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# LoRaWAN

## Overview
LoRaWAN is a low-power, long-range wireless [networking](./networking.md) protocol typically utilized for connecting battery-operated [sensors](./sensors.md) to the internet. Recent comparative research by [Mira Chen](./nova-widget.md) contrasts [SenseNode](./sensenode-sn-400.md)-class LoRaWAN setups against [MeshSync](./meshsync.md) ([Aurora](./nova-widget.md)) architectures based on a test scenario involving 10 sensor nodes, one gateway, and a 15-minute sample interval.

## Key Details
- **Architecture Setup:** Assesses a network configuration of 10 sensor nodes and one gateway operating at a 15-minute sample interval.
- **LoRaWAN Characteristics (SenseNode-class):** 
  - Subject to strict duty cycle limits in the EU, which can force either a longer effective interval or higher peak power usage.
  - Requires an always-on gateway drawing approximately 2W of wall power.
- **Comparative Findings:** MeshSync (Aurora) alternatives utilize CR2032 coin cell batteries per node, though they suffer from scale-dependent rejoin spikes (which version 0.3.8 mitigated but did not fully resolve). 
- **Total Cost of Ownership (TCO):** Preliminary conclusion drafts suggest that mesh alternatives may win on TCO due to the lack of required subscriptions and the avoidance of gateway wall-wart [power consumption](./power-consumption.md).

## Related Entities
- **Mira Chen** (Author of the 2026-07-06 LoRaWAN vs MeshSync power comparison research)
- **SenseNode** (Class of [hardware](./hardware.md)/nodes used for the LoRaWAN evaluation)
- **Aurora** (MeshSync technology used for the comparative power analysis)

## Related Concepts
- **Duty Cycle Limits** (Regulatory transmission constraints affecting EU LoRaWAN deployment intervals and peak power)
- **Rejoin Spikes** (Power consumption surges during network reconnection events in mesh networks)
- **Total Cost of Ownership (TCO)** (Financial evaluation metric favoring subscription-free, gateway-free mesh alternatives in draft conclusions)

## Contradictions
&gt; **Contradiction:** An old research tab bookmark asserted that mesh configurations always achieve lower power consumption than LoRaWAN. However, updated findings show this claim is **false at scale (8+ nodes today)** due to factors like rejoin spikes.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |

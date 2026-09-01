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
last_updated: "2026-09-01T19:19:45.849582+00:00"
sidebar_label: LoRaWAN
slug: /lorawan
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# LoRaWAN

## Overview

LoRaWAN is a low-power, wide-area [networking](./networking.md) protocol used to connect battery-operated devices to the internet. A comparative analysis by [Mira Chen](./aurora-labs.md) on July 6, 2026, evaluates the [power consumption](./power-consumption.md) and operational characteristics of LoRaWAN (using [SenseNode SN-400](./sensenode-sn-400.md)-class [hardware](./hardware.md)) against MeshSync (Aurora) based on a network of 10 sensor nodes, one gateway, and a 15-minute sample interval.

## Key Details

- **Network Scale & Interval:** Evaluated with 10 sensor nodes, one gateway, and a 15-minute sample interval.
- **LoRaWAN Characteristics:** 
  - Subject to duty cycle limits in the EU, which results in either a longer effective interval or higher peak power usage.
  - Requires an always-on gateway consuming approximately 2W of wall power.
- **Comparison to MeshSync (Aurora):**
  - MeshSync utilizes a CR2032 battery per node.
  - Rejoin spikes negatively impact MeshSync at scale; although version 0.3.8 improved the issue, it remains unsolved.
- **TCO Conclusion:** Mesh-based architectures are noted to win on Total Cost of Ownership (TCO) due to the absence of subscription costs and the elimination of gateway wall power requirements.

## Related Entities

- **Mira Chen:** Author of the comparative research between LoRaWAN and MeshSync power profiles.
- **SenseNode:** Class of hardware used for the LoRaWAN evaluation.
- **Aurora:** System utilizing the [MeshSync protocol](./meshsync-protocol.md).

## Related Concepts

- **Duty Cycle Limits:** Regulatory restrictions in the EU affecting transmission intervals and peak power for LoRaWAN devices.
- **Total Cost of Ownership (TCO):** Financial metric favoring subscription-free, gateway-free mesh topologies in the studied configuration.
- **Rejoin Spikes:** Network reconnection overhead that impacts power efficiency in mesh networks at scale.

## Contradictions

&gt; **Contradiction:** An old research tab bookmark previously asserted that mesh networks always exhibit lower power consumption; however, current data shows this is **false at 8+ nodes today**.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |

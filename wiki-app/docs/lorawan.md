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
last_updated: "2026-09-10T14:39:03.209577+00:00"
sidebar_label: LoRaWAN
slug: /lorawan
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# LoRaWAN

## Overview

[LoRaWAN](./lorawan.md) is a low-power, wide-area [networking](./networking.md) protocol evaluated in comparative power research against alternative topologies like [MeshSync](./meshsync.md) ([Aurora](./aurora-nova-widget-v2.md)). Based on research conducted by [Mira Chen](./aurora-nova-widget-v2.md) on July 6, 2026, network comparisons typically analyze small-to-medium deployments (such as 10 sensor nodes and one gateway) operating on specific sample intervals (such as 15 minutes).

## Key Details

- **Infrastructure and Power Profile:** LoRaWAN setups utilizing [SenseNode](./sensenode.md)-class devices involve an always-on gateway that draws approximately 2W of wall power.
- **Regulatory Constraints:** In regions like the EU, LoRaWAN deployments are subject to strict duty cycle limits, which can necessitate longer effective intervals or result in higher peak power usage.
- **Comparison Context:** When weighed against alternatives like MeshSync (which relies on CR2032 coin cell batteries per node), preliminary conclusions suggest trade-offs in total cost of ownership (TCO) and infrastructure requirements.

## Related Entities

- **Mira Chen:** Author of the 2026 power comparison research between LoRaWAN and MeshSync.
- **SenseNode:** Class of sensor nodes referenced in LoRaWAN deployments.
- **Aurora:** Platform associated with the competing [MeshSync protocol](./meshsync-protocol.md).

## Related Concepts

- **Duty Cycle Limits:** Regulatory restrictions in the EU that impact LoRaWAN transmission frequencies and power behavior.
- **Total Cost of Ownership (TCO):** Economic evaluation metric factoring in subscription fees and [hardware](./hardware.md) overheads (such as gateway power requirements).
- **Rejoin Spikes:** Network re-association events that impact node [power consumption](./power-consumption.md) at scale (noted primarily in mesh topologies).

## Contradictions

&gt; **Contradiction:** Older research tab bookmarks claimed that mesh networks always exhibit lower power consumption than LoRaWAN. However, updated findings indicate this assumption is false at scales of 8 or more nodes today.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |

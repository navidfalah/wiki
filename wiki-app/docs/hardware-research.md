---
id: hardware-research
title: Hardware Research
tags:
  - aurora
  - duty-cycle-limits
  - hardware-research
  - mira-chen
  - rejoin-spikes
  - sensenode
  - total-cost-of-ownership-tco
  - wiki
last_updated: "2026-09-02T06:39:50.470282+00:00"
sidebar_label: Hardware Research
slug: /hardware-research
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Research

## Overview
This research evaluates a power comparison between [LoRaWAN](./lorawan.md) and [MeshSync](./meshsync.md) technologies, conducted by Mira Chen on July 6, 2026. The evaluation is based on an assumed network setup consisting of 10 sensor nodes and one gateway, operating on a 15-minute sample interval.

## Key Details
- **Test Configuration:** 10 sensor nodes, one gateway, and a 15-minute sample interval.
- **LoRaWAN ([SenseNode SN-400](./sensenode-sn-400.md)-class):** 
  - Subject to duty cycle limits in the EU, which necessitate a longer effective interval or higher peak power.
  - The gateway is always-on, consuming approximately 2W of wall power.
- **MeshSync (Aurora):** 
  - Each node operates on a CR2032 coin cell battery.
  - Rejoin spikes negatively impact efficiency at scale ([firmware](./firmware.md) version 0.3.8 improved the issue, but has not fully solved it).
- **Conclusion:** Mesh wins on Total Cost of Ownership (TCO) due to the absence of a subscription fee and the elimination of a gateway wall wart.

## Related Entities
- **Mira Chen:** Author of the research.
- **SenseNode:** Representative class for the evaluated LoRaWAN [hardware](./hardware.md).
- **Aurora:** The hardware/protocol platform evaluated for MeshSync.

## Related Concepts
- **LoRaWAN:** A long-range, low-power wireless platform constrained by EU duty cycle limits and gateway power requirements.
- **MeshSync:** A [mesh networking](./mesh-networking.md) approach utilizing CR2032 batteries per node.
- **Duty Cycle Limits:** Regulatory constraints affecting transmission frequency and power in EU regions.
- **Rejoin Spikes:** Network re-establishment power drains that impact battery longevity at scale.
- **Total Cost of Ownership (TCO):** Financial metric favoring MeshSync due to zero subscription costs and no gateway wall power requirements.

## Contradictions
&gt; **Contradiction:** An old research tab bookmark previously indicated that mesh technology always consumes lower power. Current findings prove this is false at 8 or more nodes today due to scaling factors like rejoin spikes.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |

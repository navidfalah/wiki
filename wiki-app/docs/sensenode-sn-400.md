---
id: sensenode-sn-400
title: SenseNode SN-400
tags:
  - alex-rivera
  - aurora-beta-probe
  - aurora-labs
  - capacitive-soil-probe-corrosion
  - hardware-habit
  - ip67-enclosure
  - jonah
  - lorawan
last_updated: "2026-09-02T06:42:08.668774+00:00"
sidebar_label: SenseNode SN-400
slug: /sensenode-sn-400
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# SenseNode SN-400

## Overview

The **[SenseNode](./sensenode-sn-400.md) SN-400** is a commercial garden sensor priced at $49. It is widely recognized for its robust outdoor durability, particularly its superior weather sealing compared to competitors like the pre-release [Aurora Nova Widget v2](./aurora-nova-widget-v2.md). 

## Key Details

- **Price:** $49 USD
- **Enclosure:** Solid IP67-rated enclosure, noted as providing the best sealing in its class for outdoor deployments.
- **Connectivity:** Features an STM32WL module utilizing [LoRaWAN](./lorawan.md) (non-mesh protocol), requiring a cloud dashboard for alerts (with a limited free tier and cloud lock-in).
- **Power & Battery:** Manufacturer claims a 3-year [battery life](./battery-life.md); independent teardown and power profiling estimate approximately ~22 months under default 30-minute reporting intervals.
- **Soil Probe:** Equipped with a coated capacitive soil probe designed to withstand degradation better than cheap alternatives. Replacement probes are available for $12.

## Related Entities

- **[Hardware](./hardware.md) Habit:** The tech blog where the device teardown and review were published.
- **Alex Rivera:** Author of the Hardware Habit blog and reviewer who conducted the competitor teardown.
- **[Aurora Labs](./aurora-labs.md):** Creator of the competing pre-release Nova Widget v2 (beta unit).
- **Jonah & [Mira](./aurora-nova-widget-v2.md):** Researchers/team members who noted findings regarding the capacitive soil probe corrosion study and total cost of ownership considerations.

## Related Concepts

- **IP67 Enclosure:** Dust-tight and protected against heavy splashing and water immersion, making the SN-400 ideal for serious outdoor environments.
- **LoRaWAN:** Long-range wide-area network protocol used by the SN-400 for communication, distinct from mesh-based [protocols](./protocols.md).
- **Capacitive Soil Probe Corrosion:** A common failure point in acidic soils (where cheap probes fail in 6–9 months), mitigated in the SN-400 by a coated probe design.

## Contradictions

&gt; **Contradiction:** Manufacturer specifications for the SenseNode SN-400 claim a 3-year battery life, whereas independent hardware testing and power profiling by Hardware Habit estimate the real-world battery life to be closer to ~22 months at default 30-minute intervals.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |
| 2 | `samples/research/[SAMPLE]-2026-07-04-soil-probe-corrosion-study.txt` | text | Unverified |

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
last_updated: "2026-09-01T21:25:27.253284+00:00"
sidebar_label: SenseNode SN-400
slug: /sensenode-sn-400
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# SenseNode SN-400

## Overview
The [SenseNode](./sensenode-sn-400.md) SN-400 is a popular commercial garden sensor priced at $49, known for its rugged weather-sealing and [LoRaWAN](./lorawan.md) connectivity. It features a solid IP67 enclosure, making it a strong contender for serious outdoor agricultural and gardening deployments compared to indie competitors like the pre-release [Aurora Nova Widget v2](./aurora-nova-widget-v2.md).

## Key Details
- **Price:** $49
- **Enclosure & Weather Sealing:** Solid IP67 enclosure, considered the best-in-class sealing among comparable garden [sensors](./sensors.md).
- **Connectivity:** STM32WL module utilizing LoRaWAN (non-mesh).
- **[Battery Life](./battery-life.md):** Manufacturer claims a 3-year battery life, though independent testing and power profiling estimate **~22 months** under default 30-minute interval settings.
- **Software & Ecosystem:** Relies on a cloud dashboard for alerts, with a limited free tier (cloud lock-in).
- **Soil Probe Design:** Uses a coated capacitive soil probe designed to resist acidic soil corrosion better than cheap alternatives; replacement probes cost $12.

## Related Entities
- **[Hardware](./hardware.md) Habit:** The tech and hardware blog where the device was reviewed and torn down by author Alex Rivera.
- **Alex Rivera:** Author of the Hardware Habit blog and hardware reviewer who conducted the competitor teardown.
- **[Aurora Labs](./aurora-labs.md):** Creator of the competing pre-release Nova Widget v2 beta unit.
- **Jonah:** Researcher/team member who noted that soil probe longevity and replacement costs should be factored into total cost of ownership comparisons.
- **[Mira](./nova-widget.md):** Team member who flagged the soil probe corrosion findings for [documentation](./documentation.md) on hardware pages.

## Related Concepts
- **LoRaWAN:** The long-range wide-area network protocol used by the SN-400 for communication, which requires a gateway.
- **Capacitive Soil Probe Corrosion:** The degradation of soil sensors over time, particularly in acidic soils. The SN-400 attempts to mitigate this with a coated probe design.
- **Cloud Lock-in:** Dependence on a proprietary vendor cloud dashboard and ecosystem to access device alerts and data features.

## Contradictions
*There are no direct internal contradictions regarding the specifications of the SenseNode SN-400 across the provided sources.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |
| 2 | `samples/research/[SAMPLE]-2026-07-04-soil-probe-corrosion-study.txt` | text | Unverified |

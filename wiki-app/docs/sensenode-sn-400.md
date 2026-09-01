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
last_updated: "2026-09-01T19:21:21.758228+00:00"
sidebar_label: SenseNode SN-400
slug: /sensenode-sn-400
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# SenseNode SN-400

## Overview
The **[SenseNode](./sensenode-sn-400.md) SN-400** is a popular garden and environmental sensor priced at $49. Known for its robust weather sealing and reliable [hardware architecture](./hardware-architecture.md), it is frequently compared against indie alternatives and pre-release hardware like [Aurora Labs](./aurora-labs.md)' [Nova Widget v2](./nova-widget-v2.md).

## Key Details
- **Pricing:** Retails at $49 per unit.
- **Weather Sealing:** Features a solid **IP67** enclosure, noted as providing the best sealing in its class for serious outdoor deployments.
- **Connectivity & Hardware:** Built around an STM32WL module utilizing **[LoRaWAN](./lorawan.md)** (non-mesh network architecture).
- **[Battery Life](./battery-life.md):** The manufacturer claims a 3-year battery life; however, independent [hardware reviews](./hardware-reviews.md) estimate real-world longevity at **~22 months** under default 30-minute reporting intervals.
- **Soil Probe & Maintenance:** Employs a coated capacitive soil probe designed to withstand acidic soil environments better than cheap alternatives. Replacement probes are available for $12.
- **Software & Ecosystem:** Requires a cloud dashboard for alerts, with a limited free tier (introducing cloud lock-in).

## Related Entities
- **Hardware Habit:** The tech blog and hardware teardown publication authored by Alex Rivera.
- **Alex Rivera:** Author of the Hardware Habit teardown who evaluated the SN-400 against competing pre-release hardware.
- **Aurora Labs:** Creator of competing hardware like the Nova Widget v2.
- **Jonah & [Mira](./aurora-labs.md):** Researchers/team members who noted capacitive soil probe corrosion data for total cost of ownership [documentation](./documentation.md).

## Related Concepts
- **LoRaWAN:** The long-range wide-area network protocol used by the SN-400 to transmit data via gateways rather than local device-to-device mesh.
- **Capacitive Soil Probe Corrosion:** The degradation of soil [sensors](./sensors.md) over time, particularly in acidic soils, which the SN-400 addresses using a coated probe design.
- **IP67 Enclosure:** Ingress Protection rating ensuring dust-tight construction and protection against water immersion up to 1 meter.

## Contradictions
&gt; **Contradiction:** Manufacturer specifications claim a 3-year battery life for the SenseNode SN-400, whereas independent power profiling and teardown estimates place realistic battery performance closer to ~22 months at default 30-minute intervals.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |
| 2 | `samples/research/[SAMPLE]-2026-07-04-soil-probe-corrosion-study.txt` | text | Unverified |

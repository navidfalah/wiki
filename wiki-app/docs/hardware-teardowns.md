---
id: hardware-teardowns
title: Hardware Teardowns
tags:
  - alex-rivera
  - aurora-labs
  - hardware-habit
  - hardware-teardowns
  - ip67-enclosure
  - lorawan
  - meshsync
  - nova-widget-v2
last_updated: "2026-09-02T06:40:02.536272+00:00"
sidebar_label: Hardware Teardowns
slug: /hardware-teardowns
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Teardowns

## Overview
[Hardware](./hardware.md) teardowns provide a granular look at the physical construction, component choices, and real-world performance metrics of consumer and industrial electronics. By examining internal components, sealing methods, and power draws, reviewers can verify manufacturer claims against actual physical performance. A notable analysis published by Alex Rivera on the *Hardware Habit* blog compares popular garden [sensors](./sensors.md), focusing in detail on the commercially available [SenseNode SN-400](./sensenode-sn-400.md) and the pre-release [Aurora Nova Widget v2](./aurora-nova-widget-v2.md).

## Key Details
- **SenseNode SN-400 ($49):**
  - Features a solid IP67-rated enclosure, noted as providing the best weather sealing in its group.
  - Built with an STM32WL module utilizing [LoRaWAN](./lorawan.md) connectivity rather than mesh networks.
  - Requires a cloud dashboard for alerts, which features a limited free tier.
  - Manufacturer claims a 3-year [battery life](./battery-life.md), though real-world estimates place it closer to ~22 months at a default 30-minute interval.
- **Aurora Nova Widget v2 (Beta Unit from [Aurora Labs](./aurora-labs.md)):**
  - Uses an IP54 plastic enclosure, offering moderate sealing that is visibly less robust than the SenseNode.
  - Utilizes an nRF52840 chip paired with a custom **[MeshSync](./meshsync.md)** mesh protocol, bypassing LoRaWAN gateway fees and avoiding cloud lock-in via open [MQTT export](./mqtt-export.md).
  - Power profiling over a 48-hour sample revealed an average draw of ~92 µA with a 3-node mesh, slightly exceeding Aurora's 85 µA target.
  - Originally misreported in early [documentation](./documentation.md) as using a CR2450 battery, an editorial correction confirmed the beta unit actually operates on a **CR2032** cell, resulting in an estimated ~20-month battery life.

## Related Entities
- **Alex Rivera:** Author of the *Hardware Habit* blog and reviewer who conducted the comparative teardown.
- **Aurora Labs:** Manufacturer of the pre-release Nova Widget v2.
- **SenseNode SN-400:** Commercially available $49 garden sensor produced by SenseNode.

## Related Concepts
- **IP67 Enclosure:** High-grade dust and water protection standard featured on the SenseNode SN-400 for serious outdoor deployments.
- **LoRaWAN:** Long-range wide-area network protocol used by the SenseNode for connectivity.
- **MeshSync:** Custom mesh protocol utilized by Aurora Labs to provide flexible local connectivity without subscription fees.
- **Power Profiling:** The empirical measurement of device [power consumption](./power-consumption.md) to validate manufacturer battery life estimates.

## Contradictions
&gt; **Contradiction:** Manufacturer battery life claims differ from empirical estimates. SenseNode claims a 3-year battery life for the SN-400, while the teardown estimates approximately 22 months. Similarly, Aurora Labs targets an 85 µA power draw and a 2-year lifespan for the Nova Widget v2, but 48-hour power profiling measured an average draw of ~92 µA and an estimated lifespan of ~20 months. Additionally, an initial blog post incorrectly stated that the Nova Widget v2 used a CR2450 battery before being corrected to a CR2032 cell.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |

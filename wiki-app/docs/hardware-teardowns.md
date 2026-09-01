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
last_updated: "2026-09-01T21:23:22.493573+00:00"
sidebar_label: Hardware Teardowns
slug: /hardware-teardowns
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Teardowns

## Overview
[Hardware](./hardware.md) teardowns provide critical insights into the internal engineering, component selection, real-world [power consumption](./power-consumption.md), and build quality of competing devices. A notable comparative teardown by Alex Rivera on the *Hardware Habit* blog evaluated three popular garden [sensors](./sensors.md), focusing specifically on the commercially available **[SenseNode SN-400](./sensenode-sn-400.md)** and the pre-release [beta testing](./beta-testing.md) unit **[Nova Widget v2](./nova-widget-v2.md)** from **[Aurora Labs](./aurora-labs.md)**.

## Key Details
- **SenseNode SN-400 ($49):**
  - Features a solid **IP67** enclosure, providing the best weather sealing in its class.
  - Utilizes an STM32WL module supporting [LoRaWAN](./lorawan.md) connectivity (non-mesh).
  - Requires a cloud dashboard for alerts, which includes a limited free tier.
  - [Battery life](./battery-life.md) is claimed to be 3 years, though real-world estimates place it closer to **~22 months** at a default 30-minute interval.
- **[Aurora Nova Widget v2](./aurora-nova-widget-v2.md) (Beta Unit):**
  - Uses an **IP54** plastic enclosure, offering visibly less weather sealing than the SenseNode.
  - Equipped with an nRF52840 chip and a custom **[MeshSync](./meshsync.md)** mesh protocol, bypassing LoRaWAN subscription fees and offering open [MQTT export](./mqtt-export.md) without requiring an account.
  - Power profiling over a 48-hour sample showed an average draw of **~92 µA** with a 3-node mesh, slightly exceeding Aurora's 85 µA target.
  - Real-world estimated battery life is **~20 months**.

## Related Entities
- **Alex Rivera:** Author of the *Hardware Habit* teardown article and hardware analyst.
- **Aurora Labs:** Developer of the pre-release Nova Widget v2 beta unit.
- **SenseNode SN-400:** Manufactured garden sensor utilizing an STM32WL module and IP67 enclosure.

## Related Concepts
- **IP67 Enclosure & IP54 Plastic:** Standards used to classify the degrees of protection provided against dust, accidental contact, and water.
- **LoRaWAN vs. MeshSync:** Comparison between long-range wide-area network architecture and localized [mesh networking](./mesh-networking.md) for [IoT](./iot.md) telemetry.
- **Power Profiling:** The practice of measuring current draw over time to evaluate battery longevity against manufacturer claims.

## Contradictions
&gt; **Contradiction:** An initial version of the *Hardware Habit* blog post reported that the Aurora Nova Widget v2 used a **CR2450** battery. A correction issued on May 21, 2026, clarified that the beta unit actually uses a **CR2032** cell. Additionally, while Aurora Labs claims a 2-year battery life at 15-minute readings based on an 85 µA target, 48-hour power profiling recorded an average of 92 µA, leading to an adjusted independent estimate of ~20 months.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |

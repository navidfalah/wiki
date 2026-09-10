---
id: garden-sensors
title: Garden Sensors
tags:
  - alex-rivera
  - aurora-labs
  - garden-sensors
  - ip67-enclosure
  - lorawan
  - meshsync
  - nova-widget-v2
  - sensenode-sn-400
last_updated: "2026-09-10T14:38:16.215620+00:00"
sidebar_label: Garden Sensors
slug: /garden-sensors
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Garden Sensors

## Overview
 A [hardware](./hardware.md) teardown and comparative review by Alex Rivera for *Hardware Habit* evaluated popular options in the indie [sensor market](./sensor-market.md), focusing specifically on the **[SenseNode SN-400](./sensenode-sn-400.md)** and the pre-release **[Aurora Nova Widget v2](./aurora-nova-widget-v2.md)** by [Aurora Labs](./aurora-labs.md).

## Key Details
- **SenseNode SN-400 ($49):**
  - Features a robust **IP67** enclosure, offering the best weather sealing in its class.
  - Powered by an STM32WL module utilizing **[LoRaWAN](./lorawan.md)** connectivity (requiring a cloud dashboard and gateway subscription, with a limited free tier).
  - Claimed 3-year [battery life](./battery-life.md), though real-world [testing](./testing.md) estimates roughly **22 months** at a default 30-minute reporting interval.
- **Aurora Nova Widget v2 (Beta Unit):**
  - Built with an **IP54** plastic enclosure, offering moderate weather sealing.
  - Utilizes an nRF52840 chip running a custom **[MeshSync](./meshsync.md)** mesh protocol over [BLE](./ble.md), eliminating LoRaWAN fees and cloud lock-in by providing an open [MQTT export](./mqtt-export.md).
  - Powered by a **CR2032** coin cell battery (an initial post error incorrectly cited a CR2450 battery, which was subsequently corrected by the author).
  - Aurora Labs claims 2 years of battery life at 15-minute readings (targeted at 85 µA), while 48-hour power profiling measured an average of **~92 µA** with a 3-node mesh, yielding an estimated real-world battery life of **~20 months**.

## Related Entities
- **Alex Rivera:** Author of the *Hardware Habit* teardown blog.
- **Aurora Labs:** Manufacturer of the pre-release Nova Widget v2.
- **SenseNode SN-400:** Commercial $49 garden sensor produced by SenseNode.

## Related Concepts
- **LoRaWAN:** Long-range wide-area network technology used by the SenseNode SN-400, requiring cloud dashboard integration for alerts.
- **MeshSync:** A custom [mesh networking](./mesh-networking.md) protocol utilized by Aurora Labs to bypass gateway subscriptions and enable open MQTT data export.
- **Weather Sealing (IP54 vs IP67):** Standards of enclosure protection against dust and moisture, where IP67 provides superior outdoor durability compared to IP54.

## Contradictions
&gt; **Contradiction:** Aurora Labs claims a 2-year battery life for the Nova Widget v2 at 15-minute readings with an 85 µA target, but 48-hour power profiling measured an average of ~92 µA in a 3-node mesh [configuration](./configuration.md), resulting in a revised independent estimate of ~20 months.
&gt;
&gt; **Contradiction:** SenseNode officially claims a 3-year battery life for the SN-400, whereas independent analysis estimates closer to ~22 months at default 30-minute intervals.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/articles/2026-05-20-competitor-teardown-blog.md` | text | Unverified |

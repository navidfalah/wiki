---
id: aurora-nova-widget-v2
title: Aurora Nova Widget v2
tags:
  - alex-rivera
  - aurora-labs
  - aurora-nova-widget-v2
  - hardware-habit
  - ip67-enclosure
  - lorawan
  - meshsync
  - nova-widget-v2
last_updated: "2026-09-01T21:21:56.089094+00:00"
sidebar_label: Aurora Nova Widget v2
slug: /aurora-nova-widget-v2
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Aurora Nova Widget v2

## Overview
The **[Aurora Nova Widget](./aurora-nova-widget.md) v2** is a pre-release beta garden sensor developed by **[Aurora Labs](./aurora-labs.md)** intended for open, subscription-free data collection. Evaluated in a [hardware](./hardware.md) teardown by Alex Rivera for *Hardware Habit*, the device utilizes a custom local mesh protocol rather than traditional cellular or gateway-locked networks.

## Key Details
- **Connectivity:** Powered by an nRF52840 module utilizing custom **[MeshSync](./meshsync.md)** mesh technology ([BLE](./ble.md)-based), offering mesh flexibility without [LoRaWAN](./lorawan.md) gateway fees or cloud lock-in.
- **Data Export:** Features open [MQTT export](./mqtt-export.md), allowing users to operate the sensor without requiring an account or cloud dashboard.
- **Enclosure:** Built with an **IP54** plastic enclosure, providing moderate weather sealing suitable for casual or protected outdoor environments.
- **Power & Battery:** Uses a **CR2032** coin cell battery (corrected from an initial misidentification as a CR2450). Aurora Labs claims a 2-year [battery life](./battery-life.md) at 15-minute readings, while independent 48-hour power profiling recorded an average draw of ~92 µA with a 3-node mesh (slightly above the 85 µA target), translating to an estimated ~20-month battery life.

## Related Entities
- **Aurora Labs:** The manufacturer of the [Nova Widget v2](./nova-widget-v2.md) beta unit.
- **Alex Rivera:** Author of the *Hardware Habit* blog who performed the hardware teardown and power profiling.
- **[SenseNode SN-400](./sensenode-sn-400.md):** A competing $49 garden sensor featured in the same hardware comparison, known for its robust IP67 sealing and LoRaWAN connectivity.

## Related Concepts
- **MeshSync:** A custom mesh protocol implemented on the nRF52840 chip that allows multi-node communication without subscription fees.
- **MQTT Export:** An open protocol implementation enabling direct local data integration without mandatory cloud services.
- **Power Profiling:** Measurement of electrical current draw over a set sample period to estimate real-world battery longevity.

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the battery type used in the beta unit. While an earlier version of the blog post stated that the Nova Widget v2 used a CR2450 battery, a subsequent correction issued on May 21, 2026, confirmed that the beta unit actually uses a smaller CR2032 cell. Additionally, there is a minor variance in expected battery longevity: Aurora Labs claims a 2-year lifespan, whereas independent power profiling estimates it closer to 20 months under tested conditions.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |

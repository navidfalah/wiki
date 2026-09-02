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
last_updated: "2026-09-02T06:38:34.765432+00:00"
sidebar_label: Aurora Nova Widget v2
slug: /aurora-nova-widget-v2
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Aurora Nova Widget v2

## Overview
The **[Aurora Nova Widget](./aurora-nova-widget.md) v2** is a pre-release garden sensor developed by **[Aurora Labs](./aurora-labs.md)**. Evaluated as a beta unit in a [hardware](./hardware.md) teardown by **Alex Rivera** on the *Hardware Habit* blog, it positions itself as an open alternative to commercial [sensors](./sensors.md) like the [SenseNode SN-400](./sensenode-sn-400.md) by avoiding cloud lock-in and gateway subscription fees.

## Key Details
- **Connectivity & Architecture:** Utilizes an nRF52840 microcontroller combined with a custom **[MeshSync](./meshsync.md)** mesh network (Bluetooth/mesh-based), bypassing the need for [LoRaWAN](./lorawan.md) and gateway subscriptions.
- **Data & Export:** Features open [MQTT export](./mqtt-export.md) capability, requiring no user account for alerts or data access.
- **Power & Battery:** Powered by a **CR2032** coin cell battery (corrected from an initial mistaken report of a CR2450 cell). Aurora Labs claims a 2-year [battery life](./battery-life.md) at 15-minute readings, targeting an average draw of 85 µA. Independent power profiling over a 48-hour sample measured an average of **~92 µA** with a 3-node mesh.
- **Enclosure & Weather Sealing:** Built with an **IP54** plastic enclosure, offering moderate weather resistance that is visibly less sealed compared to heavy-duty IP67 alternatives.

## Related Entities
- **Aurora Labs:** Manufacturer of the [Nova Widget v2](./nova-widget-v2.md).
- **Alex Rivera:** Author of the *Hardware Habit* blog who conducted the hardware teardown and power profiling.
- **SenseNode SN-400:** A competing $49 garden sensor featuring an IP67 enclosure, LoRaWAN connectivity, and cloud dashboard requirements.

## Related Concepts
- **MeshSync:** Custom mesh protocol utilized by the Nova Widget v2 for local communication without LoRaWAN fees.
- **IP54 Enclosure:** Moderate dust and water splash protection rating used on the Aurora beta unit.
- **Open MQTT Export:** Protocol implementation allowing direct data retrieval without cloud service lock-in.

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the expected battery lifespan of the Nova Widget v2. Aurora Labs claims a 2-year lifespan based on 15-minute readings, whereas Alex Rivera's independent power profiling (yielding ~92 µA average draw) estimates a shorter lifespan of approximately **~20 months**. Additionally, an earlier version of the Hardware Habit post incorrectly stated the unit used a CR2450 battery before being corrected to a CR2032 cell.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |

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
last_updated: "2026-09-10T14:38:38.536139+00:00"
sidebar_label: Hardware Teardowns
slug: /hardware-teardowns
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Teardowns

## Overview
This wiki page covers comparative [hardware](./hardware.md) teardowns of garden [sensors](./sensors.md), specifically examining commercial devices and pre-release beta units. Insights are drawn from technical teardowns evaluating weather sealing, internal components, connectivity [protocols](./protocols.md), and estimated battery performance.

## Key Details
- **[SenseNode SN-400](./sensenode-sn-400.md) ($49)**:
  - Features an **IP67** enclosure, noted as the best sealing among tested devices.
  - Powered by an STM32WL module utilizing **[LoRaWAN](./lorawan.md)** (non-mesh).
  - Requires a cloud dashboard for alerts, featuring a limited free tier.
  - [Battery life](./battery-life.md): Claimed 3-year lifespan, though practical estimates suggest **~22 months** at default 30-minute intervals.
- **[Aurora Labs Nova](./aurora-nova-widget-v2.md) Widget v2 (Beta Unit)**:
  - Features an **IP54** plastic enclosure, offering moderate sealing compared to higher-rated alternatives.
  - Utilizes an nRF52840 chip paired with a custom **[MeshSync](./meshsync.md)** mesh protocol, avoiding LoRaWAN gateway fees and offering open [MQTT export](./mqtt-export.md) without requiring an account.
  - Battery life: Utilizes a **CR2032** cell (corrected from an erroneous initial report of a CR2450 cell). Aurora claims 2 years at 15-minute readings, while 48-hour power profiling records an average of **~92 µA** with a 3-node mesh (slightly above the 85 µA target), yielding an estimated **~20 months** of battery life.

## Related Entities
- **Alex Rivera**: Author of the Hardware Habit blog and hardware teardown specialist.
- **[Aurora Labs](./aurora-labs.md)**: Developer of the pre-release [Nova Widget v2](./nova-widget-v2.md) sensor.
- **[SenseNode](./sensenode.md)**: Manufacturer of the SN-400 garden sensor.

## Related Concepts
- **Hardware Teardowns**: The process of disassembling electronic devices to analyze components, build quality, and [power consumption](./power-consumption.md).
- **IP67 Enclosure & IP54 Plastic**: Ingress Protection ratings determining dust and water resistance.
- **LoRaWAN & MeshSync**: Wireless communication technologies used for long-range and local [mesh networking](./mesh-networking.md).

## Contradictions
&gt; **Contradiction:** An earlier version of the Hardware Habit blog post incorrectly reported that the [Aurora Nova Widget v2 beta](./aurora-nova-widget-v2.md) unit used a **CR2450** battery; a correction issued on May 21, 2026, clarified that the unit actually uses a **CR2032** cell.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |

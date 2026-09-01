---
id: iot-sensors
title: IoT Sensors
tags:
  - alex-rivera
  - aurora-labs
  - aurora-labs-nova
  - battery-life-optimization
  - cloud-free-iot
  - hardware-habit
  - iot-sensors
  - ip67-enclosure
last_updated: "2026-09-01T21:23:40.237590+00:00"
sidebar_label: IoT Sensors
slug: /iot-sensors
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# IoT Sensors

## Overview
[IoT](./iot.md) [sensors](./sensors.md) are [hardware](./hardware.md) devices deployed for remote monitoring in environments such as home gardens and small-acreage farms. Modern development focuses on balancing power efficiency, weather durability, connectivity [protocols](./protocols.md) (such as [LoRaWAN](./lorawan.md) versus custom mesh networks), and data ownership (cloud-free local management versus subscription-based cloud dashboards). Notable hardware comparisons include commercial offerings like the [SenseNode SN-400](./sensenode-sn-400.md) and beta units like the [Aurora Labs Nova](./aurora-nova-widget.md) Widget v2.

## Key Details
- **SenseNode SN-400 ($49):**
  - Features an IP67 enclosure, providing robust weather sealing.
  - Utilizes an STM32WL module running [LoRaWAN](./lorawan.md).
  - Requires a cloud dashboard for alerts and offers a claimed 3-year [battery life](./battery-life.md) (estimated at ~22 months under default 30-minute intervals).
- **Aurora Labs [Nova Widget v2](./nova-widget-v2.md) (Beta):**
  - Features an IP54 plastic enclosure (PETG for beta units) and is designed for home gardeners and small-acreage farmers.
  - Employs an nRF52840 microcontroller combined with a custom "[MeshSync](./meshsync.md)" mesh protocol over [BLE](./ble.md).
  - Operates cloud-free, offering open [MQTT](./mqtt.md) and CSV data exports without requiring user accounts or gateway subscriptions.
  - Uses a CR2032 coin cell battery (an earlier blog version mistakenly cited a CR2450). Aurora targets a 2-year battery life with hourly readings, while power profiling and teardown estimates place real-world performance around 20 months (~92 µA average with a 3-node mesh).
  - V1 scope includes soil moisture (capacitive), air temperature, and ambient light (simple photodiode).

## Related Entities
- **Alex Rivera:** Author and hardware reviewer for *Hardware Habit* who conducted teardowns and power profiling of the SenseNode and [Aurora Nova](./aurora-nova-widget.md) sensors.
- **Aurora Labs:** An independent hardware startup founded by [Mira Chen](./aurora-nova-widget.md) and Jonah Park in Portland, OR, focused on building open, cloud-free [IoT Devices](./iot-devices.md).
- **SenseNode:** Manufacturer of the SN-400 outdoor sensor.

## Related Concepts
- **MeshSync:** A custom [mesh networking](./mesh-networking.md) protocol designed by Mira Chen for Aurora Labs to extend range between nodes without subscription fees.
- **Battery Life Optimization:** Hardware and [firmware](./firmware.md) strategies aimed at maximizing coin cell lifespan (such as using low-power nRF52840 microcontrollers and efficient sleep profiles).
- **IP Ratings:** Ingress Protection standards determining dust and water resistance, contrasting the industrial IP67 rating of SenseNode with the lighter IP54 rating of the Aurora beta unit.

## Contradictions
&gt; **Contradiction:** Aurora Labs' internal kickoff [documentation](./documentation.md) states a power target of 2 years on a CR2032 battery with *hourly* readings, whereas independent teardown analysis and community discussions reference the 2-year claim based on *15-minute* readings.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |
| 2 | `articles/scraped-forum-thread.txt` | text | Medium |
| 3 | `notes/2026-05-01-kickoff-notes.md` | text | Medium |

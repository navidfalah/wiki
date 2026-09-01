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
last_updated: "2026-09-01T19:19:31.602618+00:00"
sidebar_label: IoT Sensors
slug: /iot-sensors
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# IoT Sensors

## Overview
[IoT](./iot.md) [sensors](./sensors.md) are [hardware](./hardware.md) devices deployed for environmental monitoring, such as tracking soil moisture, air temperature, and ambient light for home gardeners and small-acreage farmers. Recent developments in the indie sensor space highlight a design tension between robust environmental weather sealing (such as IP67 enclosures) and open, cloud-free data architectures that rely on [mesh networking](./mesh-networking.md) instead of paid subscription dashboards. Prominent hardware examples include the commercial [SenseNode SN-400](./sensenode-sn-400.md) and the pre-release [Aurora Labs Nova](./aurora-labs.md) Widget v2.

## Key Details
- **SenseNode SN-400 ($49):**
  - Features an IP67 enclosure, offering top-tier weather sealing.
  - Utilizes an STM32WL module communicating via [LoRaWAN](./lorawan.md) (non-mesh).
  - Requires a cloud dashboard for alerts, which includes a limited free tier.
  - Claimed 3-year [battery life](./battery-life.md), with real-world estimates closer to ~22 months at default 30-minute intervals.
- **Aurora Labs [Nova Widget v2](./nova-widget-v2.md) (Beta):**
  - Designed with an IP54 plastic enclosure (identified as moderately sealed).
  - Built with an nRF52840 MCU and a custom [BLE](./ble.md)-based mesh protocol known as **MeshSync**.
  - Provides open [MQTT](./mqtt.md) and CSV data exports without requiring a cloud account or subscription.
  - Powered by a CR2032 coin cell battery (an initial blog typo incorrectly stated a CR2450 battery was used). 
  - Designed to monitor soil moisture (capacitive), air temperature, and ambient light.

## Related Entities
- **Aurora Labs:** A hardware startup founded by [Mira Chen](./aurora-labs.md) and Jonah Park in Portland, OR, focused on building open, subscription-free sensors.
- **Alex Rivera:** Author and hardware reviewer for the *Hardware Habit* blog who conducted teardowns and power profiling on garden sensors.
- **SenseNode SN-400:** A competing commercial garden sensor known for its strong LoRaWAN connectivity and IP67 weather resistance.

## Related Concepts
- **MeshSync:** A custom BLE mesh protocol developed by Aurora Labs to extend range between sensor nodes without incurring LoRaWAN gateway fees.
- **Battery Life Optimization:** Engineering targets aimed at maximizing coin cell lifespan (such as CR2032) through aggressive power profiling, sleep states, and optimized reading intervals.
- **Cloud-Free IoT:** A design philosophy emphasizing local data ownership, offering direct MQTT or CSV data exports instead of mandatory cloud dashboard subscriptions.

## Contradictions
&gt; **Contradiction:** There is a discrepancy between Aurora Labs' internal design targets and independent power profiling regarding the Nova Widget's battery longevity and [power consumption](./power-consumption.md). Kickoff [meeting notes](./meeting-notes.md) state a target of 2 years on a CR2032 battery with *hourly* readings, while hardware teardown analysis and community discussions reference a 2-year lifespan based on *15-minute* readings, with actual 48-hour power profiling showing an average draw of ~92 µA (slightly exceeding the 85 µA target) resulting in an estimated ~20-month battery life.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |
| 2 | `articles/scraped-forum-thread.txt` | text | Medium |
| 3 | `notes/2026-05-01-kickoff-notes.md` | text | Medium |

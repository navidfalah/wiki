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
last_updated: "2026-09-02T06:40:21.102341+00:00"
sidebar_label: IoT Sensors
slug: /iot-sensors
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# IoT Sensors

## Overview
[IoT](./iot.md) [sensors](./sensors.md) are [hardware](./hardware.md) devices deployed for environmental monitoring, such as soil moisture, air temperature, and ambient light tracking in home gardens and small-acreage farms. Recent developments in the indie sensor space highlight a design tension between robust environmental weather sealing (such as IP67 enclosures) and user data autonomy (such as cloud-free, subscription-free [MQTT](./mqtt.md) and [mesh networking](./mesh-networking.md) [protocols](./protocols.md)). Key devices in this landscape include commercial offerings like the [SenseNode SN-400](./sensenode-sn-400.md) and pre-release beta hardware such as the [Aurora Labs Nova](./aurora-nova-widget-v2.md) Widget.

## Key Details
- **SenseNode SN-400 ($49):**
  - Features an STM32WL module using [LoRaWAN](./lorawan.md) connectivity.
  - Boasts an excellent IP67 enclosure for weather sealing.
  - Claimed 3-year [battery life](./battery-life.md), though independent teardown estimates place it closer to ~22 months at default 30-minute intervals.
  - Requires a cloud dashboard with a limited free tier for alerts.
- **Aurora Labs [Nova Widget v2](./nova-widget-v2.md) (Beta):**
  - Utilizes an nRF52840 MCU paired with a custom **[MeshSync](./meshsync.md)** protocol for [BLE](./ble.md)-based mesh networking, avoiding LoRaWAN gateway fees and cloud lock-in by supporting open MQTT/CSV export.
  - Enclosed in moderate IP54 plastic (with v1 beta units built using 3D-printed PETG).
  - Uses a CR2032 coin cell battery (an initial misconception regarding a CR2450 cell was corrected post-teardown).
  - Power profiling reveals an average draw of ~92 µA with a 3-node mesh, slightly exceeding the 85 µA target.

## Related Entities
- **Aurora Labs:** A hardware startup founded by [Mira Chen](./aurora-nova-widget-v2.md) and Jonah Park in Portland, OR, focused on cloud-free, open data IoT sensors.
- **Hardware Habit:** A tech blog authored by Alex Rivera, known for [hardware teardowns](./hardware-teardowns.md) and independent device reviews.
- **SenseNode:** Manufacturer of the SN-400 garden sensor.

## Related Concepts
- **MeshSync:** A custom mesh networking protocol designed to extend sensor range without requiring a centralized subscription cloud dashboard.
- **Battery Life Optimization:** Engineering efforts focused on achieving extended operational lifespans (e.g., targeting 2 years on coin cell batteries) through low-power sleep profiles.
- **Weather Sealing:** The degree of environmental protection provided by device enclosures, categorized by standards like IP54 (moderate) and IP67 (excellent).

## Contradictions
&gt; **Contradiction:** Aurora Labs' internal kickoff [documentation](./documentation.md) states a power target of "2 years on CR2032 with **hourly** readings," whereas independent beta teardown evaluations and community discussions reference expectations of "2 years at **15-min** readings."

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |
| 2 | `articles/scraped-forum-thread.txt` | text | Medium |
| 3 | `notes/2026-05-01-kickoff-notes.md` | text | Medium |

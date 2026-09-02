---
id: home-automation
title: Home Automation
tags:
  - alex
  - aurora-labs-nova
  - aurora-nova
  - aurora-nova-widget-v2-beta
  - battery-life-optimization
  - cloud-free-iot
  - hardware-battery-discrepancy
  - home-automation
last_updated: "2026-09-02T06:40:11.834087+00:00"
sidebar_label: Home Automation
slug: /home-automation
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Home Automation

## Overview

Home automation involves integrating [smart devices](./smart-devices.md), [sensors](./sensors.md), and local control systems to monitor and manage home environments without relying heavily on external cloud infrastructure. A prominent topic in recent home lab and forum discussions is the **[Aurora Labs Nova](./aurora-nova-widget-v2.md)** widget ecosystem, which emphasizes cloud-free operation via `meshsync` while navigating [firmware](./firmware.md) iterations, network congestion, and [hardware specifications](./hardware-specifications.md).

## Key Details

- **[Aurora Nova Widget v2 Beta](./aurora-nova-widget-v2.md)**: 
  - Operates cloud-free using `meshsync`.
  - Supports [MQTT export](./mqtt-export.md) (v2 schema is required for firmware 0.3.8+).
  - **Network Stability & Rejoin Storms**: Users running more than 6 nodes have reported rejoin issues and duplicate MQTT messages during rejoin storms. Support and community recommendations advise staying at or below 6 nodes until upgrading to firmware version 0.3.8, which addresses these issues (along with filtering neighbors topics).
- **Alternative Hardware**: 
  - *[SenseNode SN-400](./sensenode-sn-400.md)*: Offers IP67 waterproof ratings making it superior for outdoor environments, but requires a subscription service.
  - *[TeaBuddy](./teabuddy.md)*: A puck device intended for the kitchen (showcased at Maker Faire), which operates via [BLE](./ble.md) application only and does not feature MQTT support.

## Related Entities

- **Aurora Labs Nova**: Manufacturer of the Nova widget ecosystem.
- **SenseNode**: Competing [sensor hardware](./sensor-hardware.md) featuring IP67 [waterproofing](./waterproofing.md) and a subscription model.
- **TeaBuddy**: Kitchen puck device with BLE app support.
- **Alex**: Blog author who has written about [hardware teardowns](./hardware-teardowns.md) and specifications.
- **[Mira](./aurora-nova-widget-v2.md)**: Developer/contributor who posted guidance regarding node limits and GitHub issues.

## Related Concepts

- **Cloud-Free [IoT](./iot.md)**: Local communication architectures (such as `meshsync` and local MQTT brokers) that avoid cloud dependencies.
- **[Battery Life](./battery-life.md) Optimization**: Managing device read intervals to maximize longevity (e.g., Nova claiming 2 years at 15-minute reads).
- **[Firmware Updates](./firmware-updates.md)**: Upgrading devices (such as moving to version 0.3.8) to mitigate network congestion and duplicate messaging bugs.

## Contradictions

&gt; **Contradiction:** There is a discrepancy regarding the battery hardware specifications for the Aurora Nova widget. While Alex's blog states the device uses a CR2450 battery, physical teardowns of the device show that it actually utilizes a CR2032 battery. Additionally, official manufacturer claims state a 2-year battery life at 15-minute reads, whereas teardown estimates place real-world expectations closer to approximately 20 months.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/scraped-forum-thread.txt` | text | Medium |
| 2 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |
| 3 | `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt` | text | Unverified |

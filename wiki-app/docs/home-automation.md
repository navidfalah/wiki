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
last_updated: "2026-09-10T14:38:45.232940+00:00"
sidebar_label: Home Automation
slug: /home-automation
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Home Automation

## Overview
Home automation encompasses a variety of self-hosted, cloud-free Internet of Things ([IoT](./iot.md)) devices, local [mesh networking](./mesh-networking.md) setups, and community-driven [sensors](./sensors.md). Discussions around products like the [Aurora Labs Nova](./aurora-nova-widget-v2.md), [SenseNode](./sensenode.md), and auxiliary [smart devices](./smart-devices.md) highlight considerations such as local mesh capabilities, subscription models, [hardware specs](./hardware-specs.md), and software version stability.

## Key Details
- **Aurora Labs [Nova Widget](./nova-widget.md) (v2 beta):** 
  - Features local mesh synchronization (`meshsync`) without requiring a cloud connection or subscription fees (unlike competing IP67-rated alternatives like SenseNode, which involve subscriptions).
  - Designed for low [power consumption](./power-consumption.md), officially claimed to achieve up to 2 years of [battery life](./battery-life.md) at 15-minute read intervals.
  - Network limits: Users running 8 or more nodes on `meshsync` have experienced rejoin issues; current recommendations advise capping networks at 6 nodes until [firmware](./firmware.md) version 0.3.8 or later resolves the behavior.
  - Software Updates: Version 0.3.8 fixes duplicate [MQTT export](./mqtt-export.md) messages during rejoin storms and introduces a required Schema v2 for MQTT exports.
- **Other Devices:**
  - *SenseNode:* Praised for superior IP67 [waterproofing](./waterproofing.md) in outdoor environments, though criticized for its subscription requirement.
  - *[TeaBuddy Puck](./teabuddy.md):* A device showcased at Maker Faire that operates strictly via a [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) mobile app and does not support [MQTT integration](./mqtt-integration.md).

## Related Entities
- **Aurora Labs Nova**
- **SenseNode**
- **TeaBuddy Puck**
- **[MeshSync](./meshsync.md)**
- **[Home Assistant](./home-assistant.md)**

## Related Concepts
- **Cloud-Free IoT:** [Local-first](./local-first.md) home automation solutions that operate without cloud dependencies.
- **MQTT Integration:** [Protocols](./protocols.md) used to export device telemetry and metrics into platforms like Home Assistant.
- **Battery Life Optimization:** Managing read intervals and [hardware specifications](./hardware-specifications.md) to maximize sensor longevity.

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the battery hardware used in the [Aurora Nova widget](./aurora-nova-widget.md). While Alex's blog states the device utilizes a CR2450 battery, physical teardowns of the hardware reveal it actually houses a CR2032 battery. Additionally, while manufacturer claims estimate a 2-year battery life at 15-minute read intervals, independent teardown estimates place real-world expectations closer to approximately 20 months.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/scraped-forum-thread.txt` | text | Medium |
| 2 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |
| 3 | `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt` | text | Unverified |

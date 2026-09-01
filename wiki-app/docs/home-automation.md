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
last_updated: "2026-09-01T19:19:22.170283+00:00"
sidebar_label: Home Automation
slug: /home-automation
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Home Automation

## Overview
Home automation encompasses the integration of [smart devices](./smart-devices.md), [sensors](./sensors.md), and local [networking](./networking.md) [protocols](./protocols.md) to manage residential environments without relying on external cloud infrastructure. A prominent topic of discussion within the homelab and [IoT](./iot.md) community is the [Aurora Nova Widget](./aurora-nova-widget.md) device ecosystem, particularly its performance under [mesh networking](./mesh-networking.md) configurations, [battery life](./battery-life.md) optimizations, and integration with home automation platforms like [Home Assistant](./home-assistant.md) via [MQTT](./mqtt.md).

## Key Details
- **[Aurora Nova Widget v2 Beta](./aurora-nova-widget-v2.md)**: A cloud-free IoT [hardware](./hardware.md) device managed via `meshsync`. Users running [firmware](./firmware.md) version 0.3.7 or earlier have reported rejoin storms and duplicate MQTT messages when operating multiple nodes. Upgrading to version 0.3.8 resolves these duplication issues when filtering neighbors and adhering to node limits.
- **Node Limits**: Community findings and support tickets advise limiting networks to a maximum of 6 nodes until firmware version 0.3.8 or later is fully adopted to prevent stability and rejoin issues.
- **MQTT Setup**: Schema v2 is strictly required for firmware version 0.3.8 and above to handle data export correctly.
- **Comparison with [SenseNode SN-400](./sensenode-sn-400.md)**: The SenseNode offers IP67 [waterproofing](./waterproofing.md), making it preferable for outdoor environments, but requires a subscription. In contrast, the Aurora Nova operates completely cloud-free without a subscription model.

## Related Entities
- **[Aurora Labs Nova](./aurora-labs.md)** (also referred to as **Aurora Nova**): The manufacturer/product line for the Nova widget ecosystem.
- **SenseNode**: A competing outdoor-focused IoT sensor known for IP67 waterproofing and a required subscription model.
- **[TeaBuddy](./teabuddy.md)**: A kitchen puck device presented at Maker Faire, operating via [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) application control rather than MQTT.
- **Alex**: A community blogger referenced regarding hardware technical specifications.
- **Mira**: A developer or contributor posting updates on GitHub issues regarding [firmware releases](./firmware-releases.md) (such as version 0.3.8).

## Related Concepts
- **Cloud-Free IoT**: Systems designed to operate entirely locally over mesh networks (e.g., `meshsync`) without sending telemetry or state data to third-party cloud servers.
- **Battery Life Optimization**: Device energy efficiency; the manufacturer claims a 2-year battery life at 15-minute read intervals, while community teardowns estimate approximately 20 months.
- **Rejoin Storms**: Network reconnection events where multiple nodes simultaneously attempt to rejoin the mesh, causing duplicate message transmission over MQTT.

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the hardware battery specification for the Aurora Nova widget. Community member Alex's blog states the device utilizes a **CR2450** battery, whereas physical teardowns have revealed the device actually houses a **CR2032** coin cell battery.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/scraped-forum-thread.txt` | text | Medium |
| 2 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |
| 3 | `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt` | text | Unverified |

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
last_updated: "2026-09-01T21:23:30.429755+00:00"
sidebar_label: Home Automation
slug: /home-automation
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Home Automation

## Overview

Home automation encompasses managing and monitoring various connected devices within a residential environment, ranging from environmental [sensors](./sensors.md) to kitchen appliances. A prominent topic in recent discussions involves cloud-free [hardware](./hardware.md) alternatives like the [Aurora Labs Nova](./nova-widget.md) widget, local [mesh networking](./mesh-networking.md) ([MeshSync](./meshsync.md)), and integration platforms such as [Home Assistant](./home-assistant.md) via [MQTT](./mqtt.md).

## Key Details

* **Aurora Labs [Nova Widget](./nova-widget.md) (v2 beta):** 
  * Utilizes MeshSync for local, cloud-free operation.
  * Officially claimed [battery life](./battery-life.md) is 2 years at 15-minute read intervals, though community estimates suggest approximately 20 months in practice.
  * Node limits are recommended at a maximum of 6 nodes per network to avoid rejoin issues, though [firmware](./firmware.md) version 0.3.8 addresses stability improvements.
  * Requires Schema v2 for [MQTT export](./mqtt-export.md) on version 0.3.8+.
* **MQTT Setup & [Troubleshooting](./troubleshooting.md):**
  * Duplicate messages can occur during rejoin storms on firmware version 0.3.7, which can be mitigated by upgrading to 0.3.8 and filtering the neighbors topic.
* **Alternative Devices:**
  * *[SenseNode SN-400](./sensenode-sn-400.md):* Noted for superior IP67 outdoor [waterproofing](./waterproofing.md), but requires a subscription model.
  * *[TeaBuddy](./teabuddy.md):* A puck-style kitchen device presented at Maker Faire; operates via a [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) app only and does not support MQTT.

## Related Entities

* **Aurora Labs Nova** ([IoT](./iot.md) hardware vendor / product)
* **SenseNode** (Outdoor-focused IP67 sensor alternative)
* **TeaBuddy** (BLE kitchen puck device)
* **Home Assistant** (Automation and integration hub)
* **Alex** (Tech blogger referenced regarding [hardware specifications](./hardware-specifications.md))
* **[Mira](./nova-widget.md)** (Developer/contributor handling GitHub issues for firmware)

## Related Concepts

* **Cloud-Free IoT:** Local-only device control and telemetry bypassing external servers.
* **MeshSync:** Local mesh networking protocol used by the Nova widgets.
* **MQTT Export:** Protocol used for streaming sensor data into home automation hubs like Home Assistant.
* **Battery Life Optimization:** Managing read intervals and hardware efficiency for coin-cell powered wireless sensors.

## Contradictions

&gt; **Contradiction:** There is a discrepancy regarding the hardware battery specification for the [Aurora Nova Widget](./aurora-nova-widget.md). Community member Alex's blog states the device uses a CR2450 coin cell battery, whereas a physical teardown review revealed it actually houses a smaller CR2032 battery.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/scraped-forum-thread.txt` | text | Medium |
| 2 | `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt` | text | Unverified |
| 3 | `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt` | text | Unverified |

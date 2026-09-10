---
id: mqtt
title: MQTT
tags:
  - aurora-mqtt-schema-v2
  - aurora-nova-widget-v2-beta
  - meshsync
  - mosquitto
  - mqtt
  - mqtt-export
  - rejoin-storms
  - teabuddy
last_updated: "2026-09-10T14:39:25.316803+00:00"
sidebar_label: MQTT
slug: /mqtt
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MQTT

## Overview
MQTT is utilized for [Home Automation](./home-automation.md) integrations, such as connecting the Aurora Nova Widget v2 beta and [MeshSync](./meshsync.md) environments to local MQTT brokers like Mosquitto. Proper [Configuration](./configuration.md) requires specific [Firmware](./firmware.md) versions, schema versions, and management of network traffic during node rejoin events.

## Key Details
- **Prerequisites:** Requires MeshSync 0.3.8+, a local MQTT broker (Mosquitto), and Aurora MQTT schema v2.
- **Quick Start Configuration:**
  - Enable [MQTT Export](./mqtt-export.md) in device settings (use UART command `mqtt on` until full app support is available).
  - Subscribe to the telemetry topic: `aurora/+/telemetry`.
  - Map soil moisture data to percentage (`%`) entities.
- **Telemetry and Polling Intervals:** The default telemetry interval is 15 minutes. Hourly automation templates from older blog posts should be avoided.
- **Rejoin Storms and Network Quirk:** Rejoin events can flood logs when scaling to 8 nodes (support recommends limiting to 6 nodes on certain firmware versions). This can be mitigated by filtering the `mesh/neighbors` topic.
- **Firmware Upgrades:** Duplicate messages during rejoin storms are a known issue on MeshSync version 0.3.7 and are resolved by upgrading to version 0.3.8 alongside Aurora MQTT schema v2.

## Related Entities
- **Aurora Nova Widget v2 beta:** The product associated with recent MQTT setup and [Support Tickets](./support-tickets.md).
- **MeshSync:** Required middleware/synchronization tool (version 0.3.8+ recommended).
- **Mosquitto:** The local MQTT broker used for handling message ingestion.
- **[TeaBuddy](./teabuddy.md):** A kitchen device frequently brought up alongside [Homelab](./homelab.md) integrations, though it relies on a [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) app rather than MQTT.

## Related Concepts
- **Aurora MQTT Schema v2:** The required data schema format for modern MQTT exports on supported firmware.
- **Homelab Integrations:** Community-driven setups connecting [Hardware](./hardware.md) telemetry to platforms like [Home Assistant](./home-assistant.md).

## Contradictions
&gt; **Contradiction:** Regarding the TeaBuddy integration, community channels feature a joke post suggesting a microphone listens for device buzzes via an unspecified hack, while official support [Documentation](./documentation.md) clarifies that TeaBuddy has no MQTT support and relies exclusively on a BLE app.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |
| 2 | `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt` | text | Unverified |

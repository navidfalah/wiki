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
last_updated: "2026-09-01T21:24:14.511992+00:00"
sidebar_label: MQTT
slug: /mqtt
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MQTT

## Overview
MQTT is utilized within the homelab integration framework for devices such as the [Aurora Nova Widget v2 beta](./nova-widget.md). It allows local telemetry export using brokers like Mosquitto, enabling integration with platforms like [Home Assistant](./home-assistant.md) (e.g., mapping soil moisture to percentage entities). 

## Key Details
- **Prerequisites:** Requires [MeshSync](./meshsync.md) version 0.3.8+, a local MQTT broker (Mosquitto), and the Aurora MQTT schema v2.
- **Quick Start:** 
  1. Enable [MQTT Export](./mqtt-export.md) in device settings using the UART command `mqtt on` (pending full app support).
  2. Subscribe to the telemetry topic: `aurora/+/telemetry`.
  3. Map soil moisture values to `%` entities.
- **Configuration & Limits:** 
  - The default reporting interval is 15 minutes (avoid hourly automation templates from older blog posts).
  - Version 0.3.7 suffered from duplicate messages during rejoin storms; upgrading to MeshSync 0.3.8+ resolves this issue when paired with schema v2 and limiting deployments to a maximum of 6 nodes.
- **Known Quirks:** Rejoin events can flood logs at 8 nodes; this can be mitigated by filtering the `mesh/neighbors` topic.

## Related Entities
- **Aurora Nova Widget v2 beta:** The [Hardware](./hardware.md) product utilizing MQTT export features.
- **MeshSync:** The underlying synchronization tool (required at version 0.3.8+).
- **Mosquitto:** The recommended local MQTT broker.

## Related Concepts
- **Aurora MQTT schema v2:** The required data schema version for MQTT exports on supported [Firmware](./firmware.md)/software versions.
- **Telemetry export:** The mechanism of pushing device metrics over MQTT topics.
- **Rejoin storms:** Network reconnection events that can flood log outputs if neighbor topics are unfiltered.

## Contradictions
&gt; **Contradiction:** Regarding [TeaBuddy](./teabuddy.md) integration, a community guide jokes that a microphone listens for a buzz (noting it is a joke post and not a real specification), whereas support clarification explicitly states that TeaBuddy has no MQTT functionality and operates strictly via a [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) app.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |
| 2 | `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt` | text | Unverified |

---
id: iot-integrations
title: IoT Integrations
tags:
  - aurora-mqtt-schema-v2
  - iot-integrations
  - meshsync
  - mosquitto
  - teabuddy
  - telemetry-export
  - wiki
last_updated: "2026-09-01T21:23:37.686511+00:00"
sidebar_label: IoT Integrations
slug: /iot-integrations
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# IoT Integrations

## Overview
This guide covers the community-driven [Home Assistant](./home-assistant.md) integration for the [Nova Widget](./nova-widget.md), detailing prerequisites, quick start configurations, and known behavioral quirks regarding telemetry export and [MQTT](./mqtt.md) brokers.

## Key Details
- **Prerequisites:**
  - [MeshSync](./meshsync.md) version 0.3.8 or higher.
  - A local MQTT broker, such as Mosquitto.
  - [Aurora](./nova-widget.md) MQTT schema v2.
- **Quick Start Steps:**
  1. Enable [MQTT export](./mqtt-export.md) in the device settings (use the UART command `mqtt on` until official app support is added).
  2. Subscribe to the MQTT topic: `aurora/+/telemetry`.
  3. Map the soil moisture data to a percentage (`%`) entity within your [home automation](./home-automation.md) platform.
- **Known Quirks:**
  - Rejoin events can flood logs when operating at 8 nodes; filter the `mesh/neighbors` topic to mitigate this.
  - The default polling interval is 15 minutes. Avoid using hourly automation templates found in older blog posts.

## Related Entities
- **MeshSync:** Required service/tool (v0.3.8+) for managing mesh network synchronization.
- **Mosquitto:** Local MQTT broker used for handling messaging between devices.
- **Nova Widget:** The core [hardware](./hardware.md) device being integrated via community guides.
- **[TeaBuddy](./teabuddy.md):** A community-discussed accessory with no official integration.

## Related Concepts
- **Aurora MQTT Schema v2:** The standardized data structure required for telemetry communication.
- **Telemetry Export:** The mechanism of sending device metrics (like soil moisture) to a local broker.
- **UART Commands:** Low-level device configuration methods (e.g., `mqtt on`) used prior to full app support.

## Contradictions
&gt; **Contradiction:** The TeaBuddy section mentions a community hack where a microphone listens for a buzz to indicate status, but explicitly notes that this is a joke post and should not be ingested as technical specification.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |

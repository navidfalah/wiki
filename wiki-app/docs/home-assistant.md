---
id: home-assistant
title: Home Assistant
tags:
  - aurora-labs
  - aurora-mqtt-schema-v2
  - home-assistant
  - local-mqtt-export
  - meshsync
  - mira-chen
  - mosquitto
  - nova-widget
last_updated: "2026-09-02T06:40:08.036114+00:00"
sidebar_label: Home Assistant
slug: /home-assistant
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Home Assistant

## Overview

Home Assistant integrations for the [Nova Widget](./nova-widget.md) allow hobbyist users to run local, cloud-free setups via optional local [MQTT export](./mqtt-export.md). The integration relies on the [Aurora](./aurora-nova-widget-v2.md) MQTT schema v2 and works with a local [MQTT](./mqtt.md) broker such as Mosquitto.

## Key Details

- **Prerequisites:** Requires [MeshSync](./meshsync.md) 0.3.8+, a local MQTT broker (Mosquitto), and Aurora MQTT schema v2.
- **Quick Start:** 
  1. Enable MQTT export in device settings (use UART command `mqtt on` until app support is available).
  2. Subscribe to `aurora/+/telemetry`.
  3. Map soil moisture to `%` entity.
- **Topic Structure:**
  - `aurora/{device_id}/telemetry`
  - `aurora/{device_id}/battery`
  - `aurora/{device_id}/mesh/neighbors`
- **Payload Example:**
  ```json
  {
    "soil_moisture_pct": 42,
    "temp_c": 19.2,
    "read_interval_min": 15,
    "battery_mv": 2980,
    "mesh_hops": 2
  }
  ```
- **Known Quirks:** Rejoin events can flood logs at 8 nodes; users should filter the `mesh/neighbors` topic to manage this.
- **Non-Goals:** Does not include [TeaBuddy](./teabuddy.md) steep events (which belong to a different product) or cloud broker hosting by [Aurora Labs](./aurora-labs.md).

## Related Entities

- **Nova Widget:** The primary [hardware](./hardware.md) device utilizing the optional local MQTT export.
- **Aurora Labs:** The organization behind the device and schema specifications.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Owner of the Draft v2 MQTT export schema.
- **Mosquitto:** The recommended local MQTT broker used for the integration.

## Related Concepts

- **MeshSync:** Required version 0.3.8+ for managing mesh synchronization and communication.
- **Aurora MQTT Schema v2:** The structural standard defining telemetry, battery, and mesh neighbor topics and payloads.
- **Local MQTT Export:** The mechanism enabling direct, cloud-free telemetry processing.

## Contradictions

&gt; **Contradiction:** Kickoff slides originally showed hourly export batching, but the official specification and community guides establish a 15-minute interval per reading cycle (and advise against using hourly automation templates from old blog posts).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md` | text | Unverified |
| 2 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |

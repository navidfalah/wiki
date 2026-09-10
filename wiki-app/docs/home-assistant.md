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
last_updated: "2026-09-10T14:38:42.674476+00:00"
sidebar_label: Home Assistant
slug: /home-assistant
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Home Assistant

## Overview
Home Assistant integration for [Aurora Labs](./aurora-labs.md)' [Nova Widget](./nova-widget.md) allows hobbyist setups to handle local telemetry data via an optional local [MQTT Export](./mqtt-export.md), requiring no cloud connection. 

## Key Details
- **Prerequisites:** Requires [MeshSync](./meshsync.md) 0.3.8+, a local MQTT broker (such as Mosquitto), and the Aurora MQTT schema v2.
- **Quick Start:** 
  1. Enable MQTT export in device settings (using the UART command `mqtt on` until official app support is added).
  2. Subscribe to the `aurora/+/telemetry` topic.
  3. Map soil moisture values to a percentage entity.
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
- **Known Quirks:** Rejoin events can flood logs when running 8 nodes; users should filter the `mesh/neighbors` topic to manage this. 
- **Non-goals:** [TeaBuddy](./teabuddy.md) steep events and cloud broker hosting by Aurora Labs are explicitly out of scope. (A community hack involving a microphone listening for a TeaBuddy buzz was noted as a joke post and should not be ingested as a specification).

## Related Entities
- **Aurora Labs:** The organization behind the [hardware](./hardware.md) and telemetry schema.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Owner of the Draft v2 MQTT export schema.
- **Mosquitto:** The recommended local MQTT broker.

## Related Concepts
- **MeshSync:** Required component (version 0.3.8+) for managing mesh connectivity and syncing.
- **Nova Widget:** The hardware device exporting telemetry data.
- **Aurora MQTT Schema v2:** The version standard governing local MQTT telemetry payloads.

## Contradictions
&gt; **Contradiction:** Initial kickoff slides indicated hourly export batching, but the finalized specification and community guide establish a 15-minute reading cycle interval. Users are advised not to use hourly automation templates from old blog posts.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md` | text | Unverified |
| 2 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |

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
last_updated: "2026-09-01T19:19:19.795130+00:00"
sidebar_label: Home Assistant
slug: /home-assistant
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Home Assistant

## Overview

Home Assistant integrations for [Aurora Labs](./aurora-labs.md) [hardware](./hardware.md) (specifically the [Nova Widget](./nova-widget.md)) leverage an optional local [MQTT export](./mqtt-export.md) feature. This setup allows hobbyist users to run local automations and telemetry tracking without requiring a cloud connection or cloud broker hosting by Aurora Labs.

## Key Details

- **Prerequisites:** MeshSync version 0.3.8 or higher, a local MQTT broker (such as Mosquitto), and the Aurora MQTT schema v2.
- **Quick Start:** 
  1. Enable MQTT export in the device settings (or use the UART command `mqtt on` until official app support is available).
  2. Subscribe to the topic wildcard `aurora/+/telemetry`.
  3. Map the soil moisture payload to a percentage entity in Home Assistant.
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
- **Known Quirks & Maintenance:**
  - Rejoin events can flood logs when scaling to 8 nodes; users should filter the `mesh/neighbors` topic to keep logs clean.
  - [TeaBuddy](./teabuddy.md) steep events and integrations are considered out of scope or community jokes (e.g., a community hack involving a microphone listening for a buzz).

## Related Entities

- **Nova Widget:** The primary device utilizing the local MQTT export schema.
- **Aurora Labs:** The manufacturer/entity responsible for the Nova Widget hardware and telemetry schema (Draft v2 owned by [Mira Chen](./aurora-labs.md)).
- **Mosquitto:** A local MQTT broker commonly utilized in these homelab setups.

## Related Concepts

- **MeshSync:** A [networking](./networking.md)/sync layer (v0.3.8+) required for proper integration and neighborhood mesh data handling.
- **Aurora MQTT Schema v2:** The specification defining telemetry topics and payload JSON structures.
- **Local Telemetry Export:** The capability to broadcast device metrics locally without third-party cloud dependency.

## Contradictions

&gt; **Contradiction:** Kickoff slides originally showed hourly export batching for the telemetry data, whereas the Draft v2 specification and community guide mandate a 15-minute interval per reading cycle. Additionally, users are warned not to rely on hourly automation templates from older blog posts.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md` | text | Unverified |
| 2 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |

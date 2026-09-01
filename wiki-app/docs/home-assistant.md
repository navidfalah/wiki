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
last_updated: "2026-09-01T21:23:27.873935+00:00"
sidebar_label: Home Assistant
slug: /home-assistant
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Home Assistant

## Overview

Home Assistant integrations for [Aurora Labs](./aurora-labs.md) [hardware](./hardware.md), specifically the [Nova Widget](./nova-widget.md), rely on local [MQTT](./mqtt.md) exports without requiring cloud connectivity. This allows hobbyists to integrate telemetry and device data directly into their local [home-automation](./home-automation.md) setups.

## Key Details

- **Prerequisites:** 
  - [MeshSync](./meshsync.md) version 0.3.8 or higher.
  - A local MQTT broker such as Mosquitto.
  - Aurora MQTT schema v2.
- **Quick Start Steps:**
  1. Enable [MQTT export](./mqtt-export.md) in device settings (use the UART command `mqtt on` until official app support is available).
  2. Subscribe to the telemetry topic: `aurora/+/telemetry`.
  3. Map soil moisture values to percentage (`%`) entities within Home Assistant.
- **Topic Structure:**
  ```
  aurora/{device_id}/telemetry
  aurora/{device_id}/battery
  aurora/{device_id}/mesh/neighbors
  ```
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
- **Known Quirks & Non-goals:**
  - Rejoin events can flood logs when running around 8 nodes; it is recommended to filter the `mesh/neighbors` topic.
  - [TeaBuddy](./teabuddy.md) steep events and integrations are out of scope (an unofficial community joke post suggested using a microphone to listen for buzzes, but this is not part of the specification). Aurora Labs does not provide cloud broker hosting.

## Related Entities

- **Nova Widget:** The hardware device generating telemetry, battery, and mesh neighbor data.
- **[Mira Chen](./nova-widget.md):** Owner of the Draft v2 MQTT export schema.
- **Mosquitto:** A local MQTT broker commonly used to ingest telemetry.

## Related Concepts

- **MeshSync:** Required middleware (v0.3.8+) for managing mesh connectivity and data synchronization.
- **Aurora MQTT Schema v2:** The specification defining topic paths and JSON payload structures for local telemetry export.
- **Local MQTT Export:** A privacy-focused, cloud-free data pipeline compatible with hobbyist setups.

## Contradictions

&gt; **Contradiction:** Early kickoff slides indicated hourly export batching, whereas the Draft v2 specification and community guides establish a 15-minute reading cycle interval. Additionally, old blog posts mentioning hourly automation templates should be ignored in favor of the 15-minute default interval.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md` | text | Unverified |
| 2 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |

---
id: mqtt-export
title: MQTT Export
tags:
  - aurora-labs
  - home-assistant
  - local-mqtt-export
  - mira-chen
  - mqtt-export
  - nova-widget
  - reading-cycle-interval
  - teabuddy
last_updated: "2026-09-01T19:20:04.988988+00:00"
sidebar_label: MQTT Export
slug: /mqtt-export
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MQTT Export

## Overview
The optional local [MQTT](./mqtt.md) export feature for the [Nova Widget](./nova-widget.md) provides a [local-first software](./local-first-software.md) telemetry integration that requires no cloud infrastructure. Designed by Mira Chen (Draft v2), it is fully compatible with [Home Assistant](./home-assistant.md) hobbyist setups.

## Key Details
- **Status:** Draft v2
- **Broker Hosting:** No cloud broker hosting is provided by [Aurora Labs](./aurora-labs.md); the export is strictly local.
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
- **Non-Goals:** 
  - [TeaBuddy](./teabuddy.md) steep events (which belong to a different product)
  - Cloud broker hosting by Aurora Labs

## Related Entities
- **Nova Widget:** The [hardware](./hardware.md) device generating the telemetry and utilizing this local export schema.
- **Home Assistant:** The target hobbyist platform compatible with this local MQTT export.
- **Mira Chen:** The owner and author of the MQTT export specification draft.
- **Aurora Labs:** The organization developing the Nova Widget (with a non-goal of providing cloud broker hosting).

## Related Concepts
- **MeshSync:** The underlying mesh and synchronization framework associated with the export tags.
- **Local MQTT Export:** The core architectural approach allowing device data to be published locally without cloud dependencies.
- **Reading Cycle Interval:** The frequency at which device readings and telemetry payloads are published.

## Contradictions
&gt; **Contradiction:** Kickoff slides showed hourly export batching — spec is 15 min per reading cycle.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md` | text | Unverified |

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
last_updated: "2026-09-02T06:40:54.275133+00:00"
sidebar_label: MQTT Export
slug: /mqtt-export
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MQTT Export

## Overview

The [MQTT](./mqtt.md) Export feature provides an optional local MQTT export mechanism for the [Nova Widget](./nova-widget.md), requiring no cloud infrastructure. It is fully compatible with [Home Assistant](./home-assistant.md) hobbyist setups and is owned by [Mira Chen](./aurora-nova-widget-v2.md) (Draft v2 status).

## Key Details

### Topic Structure
The MQTT export utilizes the following hierarchical topic structure:
* `aurora/{device_id}/telemetry`
* `aurora/{device_id}/battery`
* `aurora/{device_id}/mesh/neighbors`

### Payload Example
A standard telemetry payload contains the following fields:
```json
{
  "soil_moisture_pct": 42,
  "temp_c": 19.2,
  "read_interval_min": 15,
  "battery_mv": 2980,
  "mesh_hops": 2
}
```

### Non-Goals
* [TeaBuddy](./teabuddy.md) steep events (which belong to a different product).
* Cloud broker hosting by [Aurora Labs](./aurora-labs.md).

## Related Entities

- **Nova Widget**: The primary device utilizing this optional local MQTT export feature.
- **Home Assistant**: The hobbyist platform compatible with the local MQTT export.
- **Aurora Labs**: The organization developing the Nova Widget and declining cloud broker hosting.
- **Mira Chen**: The owner of the Draft v2 MQTT export schema.

## Related Concepts

- **Local MQTT Export**: Cloud-free telemetry transmission directly from device to local broker.
- **Reading Cycle Interval**: The frequency at which data readings and exports occur.
- **[MeshSync](./meshsync.md)**: Related protocol technology context referenced alongside Nova Widget and MQTT.

## Contradictions

&gt; **Contradiction:** Kickoff slides showed hourly export batching, whereas the current specification establishes a 15-minute interval per reading cycle.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md` | text | Unverified |

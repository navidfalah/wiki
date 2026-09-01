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
last_updated: "2026-09-01T21:24:12.515893+00:00"
sidebar_label: MQTT Export
slug: /mqtt-export
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MQTT Export

## Overview

The [MQTT](./mqtt.md) Export is an optional local telemetry export feature for the [Nova Widget](./nova-widget.md), designed to operate without requiring a cloud connection. It is fully compatible with [Home Assistant](./home-assistant.md) hobbyist setups and is owned by Mira Chen (Draft v2 status).

## Key Details

### Topic Structure
The [MQTT](./mqtt.md) export organizes data using the following topic structure:
* `aurora/{device_id}/telemetry`
* `aurora/{device_id}/battery`
* `aurora/{device_id}/mesh/neighbors`

### Payload Example
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
* [TeaBuddy](./teabuddy.md) steep events (managed as a separate product)
* Cloud broker hosting by [Aurora Labs](./aurora-labs.md)

## Related Entities

* **Mira Chen:** Feature owner and author of the draft specification.
* **Nova Widget:** The [hardware](./hardware.md)/software device utilizing the local MQTT export.
* **Home Assistant:** The hobbyist automation platform compatible with this local export feature.
* **Aurora Labs:** The organization behind the hardware, though they do not provide cloud broker hosting for this feature.
* **TeaBuddy:** A separate product explicitly excluded from this export mechanism.

## Related Concepts

* **Local MQTT Export:** Direct, cloud-free data transmission via the [MQTT](./mqtt.md) protocol.
* **Reading Cycle Interval:** The frequency at which data readings and exports occur.
* **[MeshSync](./meshsync.md):** Associated protocol concept referenced in the feature's design tags.

## Contradictions

&gt; **Contradiction:** Kickoff slides previously showed hourly export batching, whereas the current specification defines a 15-minute interval per reading cycle.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md` | text | Unverified |

---
id: data-schema
title: Data Schema
tags:
  - aurora-labs
  - data-schema
  - home-assistant
  - hourly-export-batching
  - local-mqtt-export
  - mira-chen
  - mqtt-export-schema
  - non-goals
last_updated: "2026-06-25T07:19:48.581019+00:00"
sidebar_label: Data Schema
slug: /data-schema
---

# Data Schema

## Overview

The Data Schema primarily defines the structure for optional [Local MQTT Export](./local-mqtt-export.md)s from the [Nova Widget](./nova-widget.md). This schema is designed for compatibility with hobbyist setups, such as [Home Assistant](./home-assistant.md), and operates without requiring cloud services. It enables devices to export [telemetry](./telemetry.md) data directly to a local [MQTT broker](./mqtt-broker.md).

## Key Details

### MQTT Export Schema (Nova Widget)

The schema outlines the [MQTT](./mqtt.md) topic structure and [payload](./payload.md) format for data exported by [Nova Widget](./nova-widget.md) devices. This allows for local data integration without reliance on cloud infrastructure.

*   **Status**: Draft v2
*   **Owner**: [Mira Chen](./mira-chen.md)

### MQTT Topic Structure

The following topic structure is used for organizing data exports:

*   `aurora/{device_id}/telemetry`: Used for general [sensor readings](./sensor-readings.md) and [environmental data](./environmental-data.md).
*   `aurora/{device_id}/battery`: Dedicated to reporting [Battery](./battery.md) status.
*   `aurora/{device_id}/mesh/neighbors`: Provides information about the device's [Mesh network](./mesh-network.md) neighbors.

### Payload Example

Data is exported as a JSON object within the [MQTT](./mqtt.md) message [payload](./payload.md). An example [payload](./payload.md) structure is:

```json
{
  "soil_moisture_pct": 42,
  "temp_c": 19.2,
  "read_interval_min": 15,
  "battery_mv": 2980,
  "mesh_hops": 2
}
```

Key fields include:

*   `soil_moisture_pct`: Percentage of [Soil moisture](./soil-moisture.md).
*   `temp_c`: [Temperature](./temperature.md) in degrees Celsius.
*   `read_interval_min`: The interval, in minutes, at which readings are taken. The current specification is 15 minutes.
*   `battery_mv`: [Battery](./battery.md) voltage in millivolts.
*   `mesh_hops`: The number of hops in the [Mesh network](./mesh-network.md) to reach the device.

### Non-Goals

The scope of this data schema specifically excludes:

*   **[TeaBuddy steep events](./teabuddy-steep-events.md)**: These belong to a different product line and have their own distinct data schema.
*   **[Cloud broker hosting by Aurora Labs](./cloud-broker-hosting-by-aurora-labs.md)**: [Aurora Labs](./aurora-labs.md) does not provide cloud-based [MQTT broker](./mqtt-broker.md) hosting for these local exports.

## Related Entities

*   **[Aurora Labs](./aurora-labs.md)**: The organization developing the [Nova Widget](./nova-widget.md) and this data schema.
*   **[Mira Chen](./mira-chen.md)**: The owner of this specific [MQTT Export](./mqtt-export.md) schema draft.
*   **[Nova Widget](./nova-widget.md)**: The device that utilizes this data schema for local MQTT exports.
*   **[Home Assistant](./home-assistant.md)**: A popular home automation platform compatible with this local MQTT export schema.

## Related Concepts

*   **[MQTT Export](./mqtt-export.md)**: The process of sending data via the Message Queuing Telemetry Transport protocol.
*   **[Local MQTT Export](./local-mqtt-export.md)**: Data export that occurs entirely within a local network, without requiring internet connectivity or cloud services.
*   **[MeshSync](./meshsync.md)**: A related technology or concept, likely pertaining to mesh network synchronization, mentioned in the source document's tags.
*   **[Hourly Export Batching](./hourly-export-batching.md)**: A concept related to data export frequency, which is contrasted with the current specification.

## Contradictions

**Contradiction:** Initial kickoff slides for this project indicated an intention for [hourly export batching](./hourly-export-batching.md). However, the current specification for the [Nova Widget](./nova-widget.md) defines a reading cycle and export interval of 15 minutes.

## Sources

*   `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md`

---
id: mqtt-export
title: MQTT Export
tags:
  - aurora-labs
  - home-assistant
  - hourly-export-batching
  - local-mqtt-export
  - mira-chen
  - mqtt-export
  - mqtt-export-schema
  - non-goals
last_updated: "2026-06-25T07:42:17.928461+00:00"
sidebar_label: MQTT Export
slug: /mqtt-export
---

# MQTT Export

## Overview

This page describes the optional local MQTT export functionality, primarily designed for devices like the [Nova Widget](./Nova Widget.md). This feature allows for data export without requiring cloud services and is compatible with hobbyist setups such as [Home Assistant](./Home Assistant.md). The current specification is in Draft v2, with [Mira Chen](./Mira Chen.md) as the owner.

## Key Details

*   **Purpose**: Provides [Local MQTT Export](./Local MQTT Export.md) capabilities for devices, notably the Nova Widget.
*   **Cloud Independence**: The system is designed to operate without requiring cloud services or [Aurora Labs](./Aurora Labs.md) hosting a cloud MQTT broker.
*   **Compatibility**: Engineered for compatibility with Home Assistant hobbyist setups.
*   **Topic Structure**: Data is published to specific MQTT topics, using `device_id` as a unique identifier:
    *   `aurora/{device_id}/telemetry`
    *   `aurora/{device_id}/battery`
    *   `aurora/{device_id}/mesh/neighbors`
*   **Payload Example**: A typical [Telemetry Data](./Telemetry Data.md) payload includes various sensor readings and device status:
    ```json
    {
      "soil_moisture_pct": 42,
      "temp_c": 19.2,
      "read_interval_min": 15,
      "battery_mv": 2980,
      "mesh_hops": 2
    }
    ```
*   **Reading Cycle**: The specification indicates a 15-minute interval for data readings.
*   **Non-Goals**:
    *   Handling [TeaBuddy](./TeaBuddy.md) steep events, as this is a separate product.
    *   Aurora Labs providing cloud broker hosting for MQTT.

## Related Entities

*   **Aurora Labs**: The organization developing the MQTT export feature.
*   **Home Assistant**: A popular home automation platform with which the MQTT export is designed to be compatible.
*   **Mira Chen**: The owner of the MQTT export specification.
*   **Nova Widget**: A primary device intended to utilize this MQTT export functionality.
*   **TeaBuddy**: Another product mentioned as a non-goal for this specific MQTT export schema.

## Related Concepts

*   **Local MQTT Export**: The core concept of exporting data via MQTT without reliance on external cloud infrastructure.
*   **Telemetry Data**: The sensor readings and operational data exported by devices.
*   **Battery Monitoring**: A specific type of [Battery Monitoring](./Battery Monitoring.md) data, including battery voltage.
*   **Mesh Networking**: Concepts related to device communication, including `mesh/neighbors` and `mesh_hops` in the payload. ([Mesh Networking](./Mesh Networking.md))
*   **MeshSync**: A related technology or concept mentioned in the source tags. ([MeshSync](./MeshSync.md))
*   **Hourly Export Batching**: A concept initially considered but superseded by a more frequent reading cycle. ([Hourly Export Batching](./Hourly Export Batching.md))

## Contradictions

*   **Contradiction:** While initial kickoff slides suggested an Hourly Export Batching interval, the current specification details a 15-minute reading cycle for data collection.

## Sources

*   `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md`

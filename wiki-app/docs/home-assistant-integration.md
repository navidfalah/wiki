---
id: home-assistant-integration
title: Home Assistant Integration
tags:
  - home-assistant
  - mqtt
  - nova-widget
  - homelab
  - firmware-upgrade
  - telemetry
  - mesh-networking
  - aurora-labs
last_updated: "2026-06-25T07:27:39.868509+00:00"
sidebar_label: Home Assistant Integration
slug: /home-assistant-integration
---

```markdown
# Home Assistant Integration

## Overview

The Aurora Nova Widget v2 beta offers an optional local [MQTT](./mqtt.md) export feature designed for seamless integration with Home Assistant hobbyist setups. This integration does not require cloud services, allowing users to maintain full local control over their device data. It is primarily supported for the Aurora Nova Widget v2 beta product.

## Key Details

### MQTT Export

*   **Local-Only**: The MQTT export is an optional local feature, requiring no cloud broker hosting by [Aurora Labs](./aurora-labs.md).
*   **Schema Version**: MQTT export schema `v2` is required for firmware `0.3.8` and newer.
*   **Topic Structure**: Data is published to specific topics under the `aurora/{device_id}/` prefix:
    *   `aurora/{device_id}/telemetry`
    *   `aurora/{device_id}/battery`
    *   `aurora/{device_id}/mesh/neighbors`
*   **Payload Example (Telemetry)**:
    ```json
    &#123;
      "soil_moisture_pct": 42,
      "temp_c": 19.2,
      "read_interval_min": 15,
      "battery_mv": 2980,
      "mesh_hops": 2
    &#125;
    ```
*   **Reading Cycle**: The Nova Widget performs a reading cycle every 15 minutes.

### Firmware and Troubleshooting

*   **Duplicate Messages**: Firmware version `0.3.7` is known to produce duplicate MQTT messages, particularly during mesh rejoin storms.
*   **Resolution**: Upgrading to firmware `0.3.8` or a newer version is recommended to resolve issues with duplicate messages.
*   **Configuration Tips**:
    *   Filter the `mesh/neighbors` topic if not all neighbor data is needed.
    *   Limit the number of reported neighbor nodes to 6 for optimal performance.

### Non-Goals

*   [TeaBuddy](./teabuddy.md) Integration**: The TeaBuddy product does not support MQTT export; it is a BLE app-only device.
*   **Cloud Broker Hosting**: Aurora Labs does not provide cloud broker hosting for MQTT.

## Related Entities

*   **Aurora Nova Widget v2 beta**: The primary product supporting this integration.
*   **Aurora Labs**: The developer of the Nova Widget.
*   Homelab**: A common customer type utilizing this integration for personal automation setups.
*   **TeaBuddy**: A different product from Aurora Labs that does not support MQTT.

## Related Concepts

*   **MQTT (Message Queuing Telemetry Transport)**: A lightweight messaging protocol used for IoT devices.
*   [MeshSync](./meshsync.md)**: A technology likely related to the mesh networking capabilities of the Nova Widget.
*   Telemetry**: The process of recording and transmitting readings from instruments.
*   Firmware Upgrade**: The process of updating the software embedded in the device.
*   **BLE (Bluetooth Low Energy)**: A wireless technology used by some Aurora Labs products, like TeaBuddy.

## Contradictions

> **Contradiction:** Initial kickoff slides for the MQTT export feature showed hourly export batching, however, the current specification details a 15-minute reading cycle.

## Sources

*   `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md`
*   `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt`
```

---
id: mqtt-setup
title: MQTT Setup
tags:
  - ble-app-only
  - duplicate-messages
  - filtering-neighbors-topic
  - firmware-upgrade
  - home-assistant
  - homelab
  - mqtt-export
  - mqtt-export-schema
last_updated: "2026-06-25T07:42:37.248620+00:00"
sidebar_label: MQTT Setup
slug: /mqtt-setup
---

# MQTT Setup

## Overview

MQTT (Message Queuing Telemetry Transport) setup involves configuring devices, such as the Aurora Nova Widget v2 beta, to export data via MQTT. This is particularly useful for integrating with home automation systems like Home Assistant. Proper configuration, including firmware updates and schema versioning, is crucial for stable and reliable data export.

## Key Details

*   **Enabling MQTT Export**: MQTT export can be enabled on compatible devices.
*   **Addressing Duplicate Messages**:
    *   Duplicate messages during "rejoin storms" are a known issue on firmware version 0.3.7.
    *   To resolve this, upgrade the device firmware to version 0.3.8 or newer.
    *   Additionally, filter the "neighbors topic" to reduce redundant data.
    *   It is recommended to limit the number of connected nodes to 6 to mitigate this issue.
*   **MQTT Export Schema**:
    *   For devices running firmware 0.3.8 or newer, MQTT export schema version 2 (v2) is required.
    *   Refer to the `mqtt-export-schema` sample documentation for detailed information on the schema.
*   **Product Compatibility**:
    *   The Aurora Nova Widget v2 beta supports MQTT export.
    *   The TeaBuddy device does not support MQTT; it is a BLE (Bluetooth Low Energy) app-only device.

## Related Entities

*   **Aurora Nova Widget v2 beta**: A product that supports MQTT export.
*   **Home Assistant**: A popular open-source home automation platform that can integrate with MQTT.
*   **TeaBuddy**: A product that does not support MQTT, relying solely on a BLE application.
*   **homelab**: A customer environment that utilizes MQTT for integration, as referenced in support ticket #9102.

## Related Concepts

*   **MQTT Export**: The process of sending device data over the MQTT protocol.
*   **MQTT Export Schema**: The defined structure and format of data exported via MQTT.
*   **Firmware Upgrade**: Updating the software embedded in a hardware device to a newer version, often to fix bugs or add features.
*   **BLE App Only**: Indicates a device that communicates exclusively via Bluetooth Low Energy and is controlled through a dedicated mobile application, without support for other protocols like MQTT.

## Contradictions

No contradictions were found in the provided source material.

## Sources

*   `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt`

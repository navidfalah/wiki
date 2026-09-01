---
id: mqtt
title: MQTT
tags:
  - mqtt
  - home assistant
  - meshsync
  - mqtt broker
  - aurora schema
  - telemetry
  - automation
  - device integration
last_updated: "2026-06-25T07:42:46.694183+00:00"
sidebar_label: MQTT
slug: /mqtt
---

# MQTT

## Overview

MQTT (Message Queuing Telemetry Transport) is a lightweight messaging protocol used for device Data Export and integration with Home Automation systems like Home Assistant. It facilitates efficient communication, especially for resource-constrained devices and unreliable networks. This page outlines its use for integrating devices with a Local Broker and Home Assistant, including prerequisites, quick start steps, and known operational quirks.

## Key Details

### Prerequisites for Integration

To integrate devices using MQTT, the following components are required for Device Integration:

*   **MeshSync**: Version 0.3.8 or newer.
*   **Local Broker**: A local instance of an MQTT broker, such as Mosquitto, is necessary to manage message traffic.
*   **Aurora MQTT Schema**: Devices must utilize Aurora MQTT schema v2 for data formatting.

### Quick Start Guide

Follow these steps to enable MQTT export and integrate with a system like Home Assistant:

1.  **Enable MQTT Export**: Activate MQTT export on the device. Currently, this is done via the UART command `mqtt on` until app support is available.
2.  **Subscribe to Telemetry**: Subscribe to the `aurora/+/telemetry` topic on your MQTT broker to receive device data.
3.  **Map Data to Entities**: Map specific telemetry data, such as soil moisture readings, to appropriate entities (e.g., a `%` entity) within your Home Automation system.

### Known Quirks and Considerations

*   **Log Flooding from Rejoin Events**: When operating with 8 or more nodes, device rejoin events can significantly flood logs. To mitigate this, it is recommended to filter the `mesh/neighbors` topic.
*   **Default Telemetry Interval**: The default telemetry export interval is 15 minutes. Be aware of this when setting up automations; avoid using hourly Automation Templates from older blog posts, as they may not align with this default interval.

### Unofficial Integrations

*   **TeaBuddy**: There is no official integration for TeaBuddy. Community discussions about "microphone listening for buzz" are considered joke posts and should not be taken as specifications or official guidance.

## Related Entities

*   Home Assistant
*   MeshSync
*   Mosquitto (as a Local Broker)
*   Aurora (implied by schema)

## Related Concepts

*   Telemetry
*   Home Automation
*   Data Export
*   Local Broker
*   Device Integration
*   Automation Templates

## Contradictions

No contradictions were found in the provided source material.

## Sources

*   `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md`

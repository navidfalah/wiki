---
id: homelab-integration
title: Homelab Integration
tags:
  - aurora-mqtt-schema-v2
  - default-interval-15-min
  - filter-meshneighbors-topic
  - home-assistant
  - homelab-integration
  - hourly-automation-templates
  - local-mqtt-broker
  - map-soil-moisture-to-entity
last_updated: "2026-06-25T07:27:50.876011+00:00"
sidebar_label: Homelab Integration
slug: /homelab-integration
---

# Homelab Integration

## Overview

Homelab Integration, particularly with platforms like Home Assistant, enables users to connect their devices and sensors to a local home automation system. This integration typically leverages MQTT for data export and requires specific software versions and configurations to function correctly. The process involves enabling MQTT export on devices, subscribing to relevant telemetry topics, and mapping sensor data to entities within the home automation platform.

## Key Details

### Prerequisites

To successfully integrate devices into a homelab environment, the following prerequisites must be met:

*   **MeshSync:** Version 0.3.8 or newer.
*   **Local MQTT Broker:** A local MQTT broker, such as Mosquitto, is required for message queuing and distribution.
*   **Aurora MQTT Schema:** Devices must be configured to use Aurora MQTT schema v2 for data formatting.

### Quick Start Guide

Follow these steps for a rapid integration setup:

1.  **Enable MQTT Export:** Activate MQTT export in your device settings. This can currently be done via the UART command `mqtt on` until official app support is available.
2.  **Subscribe to Telemetry:** Subscribe to the `aurora/+/telemetry` MQTT topic to receive data from your devices.
3.  **Map Soil Moisture:** Map the received soil moisture data to a percentage (`%`) entity within your home automation system.

### Known Quirks

Users should be aware of the following common issues and recommendations:

*   **Rejoin Events:** When operating with 8 or more nodes, rejoin events can generate a significant volume of log entries. It is recommended to filter the `mesh/neighbors` MQTT topic to manage log noise.
*   **Default Interval:** The default data export interval is 15 minutes. Avoid using hourly automation templates found in older blog posts, as they may not align with this default interval.

## Related Entities

*   **Home Assistant:** A popular open-source home automation platform often used for homelab integrations.
*   **Mosquitto:** A widely used open-source MQTT broker.
*   **MeshSync:** A component or software version critical for device compatibility.

## Related Concepts

*   **MQTT (Message Queuing Telemetry Transport):** A lightweight messaging protocol for small sensors and mobile devices, optimized for high-latency or unreliable networks.
*   **Aurora MQTT Schema v2:** A specific data format and structure used for MQTT messages from integrated devices.
*   **Telemetry:** The process of recording and transmitting the readings of an instrument.
*   **Automation Templates:** Pre-defined configurations or scripts used to automate tasks within a home automation system.

## Contradictions

*   **Contradiction:** The "TeaBuddy" section in the source explicitly states it's a "joke post, do not ingest as spec." Therefore, there is no official integration for TeaBuddy, and any mention of a community hack involving a microphone listening for buzz should be disregarded as non-factual and not part of the integration specification.

## Sources

*   `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md`

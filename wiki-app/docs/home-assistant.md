---
id: home-assistant
title: Home Assistant
tags:
  - aurora-mqtt-schema-v2
  - default-interval-15-min
  - filter-meshneighbors-topic
  - home-assistant
  - hourly-automation-templates
  - local-mqtt-broker
  - map-soil-moisture-to-entity
  - meshsync-038
last_updated: "2026-06-25T07:27:47.750855+00:00"
sidebar_label: Home Assistant
slug: /home-assistant
---

# Home Assistant

## Overview

Home Assistant is a popular open-source home automation platform. This page outlines an unofficial community guide for integrating Nova Widget devices with Home Assistant, primarily leveraging MQTT for data export and control.

## Key Details

### Prerequisites for Integration

To integrate Nova Widget devices with Home Assistant, the following prerequisites must be met:

*   **MeshSync**: Version 0.3.8 or newer.
*   **Local MQTT Broker**: A local MQTT broker, such as Mosquitto, is required to facilitate communication.
*   **Aurora MQTT Schema**: The Aurora MQTT Schema v2 must be in use for data formatting.

### Quick Start Guide

Follow these steps for a basic integration:

1.  **Enable MQTT Export**: Enable MQTT export in the device settings. This can currently be done via the UART command `mqtt on` until app support is available.
2.  **Subscribe to Telemetry**: Subscribe to the `aurora/+/telemetry` MQTT topic to receive data from your devices.
3.  **Map Soil Moisture**: Map the received soil moisture data to a percentage (`%`) entity within Home Assistant.

### Known Quirks

Users should be aware of the following known behaviors:

*   **Log Flooding**: Rejoin events can flood logs when operating with 8 or more nodes. To mitigate this, filter the `mesh/neighbors` topic.
*   **Default Interval**: The default data reporting interval is 15 minutes. Avoid using hourly automation templates found in older blog posts, as they may not align with this default interval.

### TeaBuddy Integration

There is currently no official integration for TeaBuddy with Home Assistant.

## Related Entities

*   Nova Widget
*   Mosquitto
*   TeaBuddy

## Related Concepts

*   MQTT
*   MeshSync
*   Aurora MQTT Schema

## Sources

*   `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md`

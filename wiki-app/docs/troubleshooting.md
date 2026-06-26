---
id: troubleshooting
title: Troubleshooting
tags:
  - ble-app-only
  - duplicate-messages
  - filtering-neighbors-topic
  - firmware-upgrade
  - home-assistant
  - homelab
  - mqtt-export
  - mqtt-export-schema
last_updated: "2026-06-25T08:04:46.800831+00:00"
sidebar_label: Troubleshooting
slug: /troubleshooting
---

```markdown
# Troubleshooting

This page provides guidance on common troubleshooting scenarios, particularly concerning MQTT export, Home Assistant integration, and device-specific features.

## Overview

Troubleshooting often involves addressing issues like duplicate data, ensuring correct configuration for integrations like Home Assistant, and understanding device capabilities. This guide synthesizes solutions from support interactions to help resolve common problems.

## Key Details

### Duplicate MQTT Messages

*   **Problem**: Users may experience duplicate MQTT messages, especially during "rejoin storms." This was a known issue with firmware version 0.3.7.
*   **Solution**:
    *   **Firmware Upgrade**: Upgrade your device firmware to version 0.3.8 or newer.
    *   **Filter `neighbors` Topic**: Implement filtering for the `neighbors` topic in your MQTT setup.
    *   **Limit Nodes**: Consider limiting the number of nodes to 6 to reduce potential message overhead.

### MQTT Export Schema

*   **Schema Version Requirement**: For devices running firmware 0.3.8 or newer, MQTT export requires **Schema v2**.
*   **Reference**: Consult the `mqtt-export-schema` sample documentation for detailed information on Schema v2.

### Device-Specific Features (TeaBuddy)

*   **No MQTT Support**: The TeaBuddy device does not support MQTT export.
*   **Connectivity**: TeaBuddy devices are designed for BLE (Bluetooth Low Energy) app-only interaction.

## Related Entities

*   **Aurora Nova Widget v2 beta**: A product mentioned in a support context.
*   **Home Assistant**: A popular home automation platform often integrated with MQTT export.
*   **TeaBuddy**: A specific device that operates via BLE app only and lacks MQTT capabilities.
*   **homelab**: Refers to a customer or user environment, often indicating a self-managed setup.

## Related Concepts

*   **MQTT Export**: The process of sending device data via the MQTT protocol.
*   **Firmware Upgrade**: Updating the software embedded in a device to a newer version.
*   **BLE (Bluetooth Low Energy)**: A wireless personal area network technology used for short-range communication.
*   **MQTT Export Schema**: The defined structure or format of data exported via MQTT (e.g., v1, v2).
*   **Duplicate Messages**: Identical messages received multiple times, often due to network instability or software bugs.
*   **Rejoin Storms**: A scenario where multiple devices repeatedly disconnect and reconnect to a network, leading to a flood of status messages.
*   **Filtering Topics**: Configuring an MQTT client or broker to only process messages from specific topics.

## Contradictions

No contradictions were identified in the provided source material.

## Sources

*   `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt`
```

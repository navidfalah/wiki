---
id: product-support
title: Product Support
tags:
  - aurora-nova-widget-v2-beta
  - meshsync
  - firmware-upgrade
  - mqtt
  - home-assistant
  - scalability
  - ble-app-only
  - duplicate-messages
last_updated: "2026-06-25T07:52:38.926001+00:00"
sidebar_label: Product Support
slug: /product-support
---

# Product Support

This page synthesizes common issues, solutions, and product information derived from customer support interactions, primarily focusing on the Aurora Nova Widget v2 beta and related products.

## Overview

Product support tickets often highlight recurring technical challenges, known bugs, and specific product limitations. This information is crucial for understanding product behavior, identifying necessary Firmware Upgrades, and guiding users on best practices or workarounds.

## Key Details

### Aurora Nova Widget v2 Beta - MeshSync Issues

*   **Mesh Rejoin Loop**:
    *   **Problem**: Adding an 8th node to an Aurora Nova Widget v2 beta mesh can cause the entire mesh to stop reporting for hours. A power cycle provides only a temporary fix. This is a known "rejoin spike" issue.
    *   **Solution/Mitigation**: A fix is anticipated in firmware version 0.3.8. Until this patch is available, it is recommended to limit the mesh to a maximum of 6 nodes.
    *   **Context**: [MeshSync](./meshsync.md) technology, while avoiding Cloud Subscriptions, introduces complexity at scale. This contrasts with simpler topologies like [SenseNode](./sensenode.md), which may handle more devices but often require a Cloud Subscription.

### Aurora Nova Widget v2 Beta - MQTT Export Issues

*   **Duplicate Messages**:
    *   **Problem**: When [MQTT](./mqtt.md) export is enabled, duplicate messages can occur during "rejoin storms," particularly on firmware version 0.3.7.
    *   **Solution**: Upgrade to firmware version 0.3.8 or later. To mitigate duplicates, users should filter the "neighbors topic" in their [MQTT](./mqtt.md) setup. Limiting the mesh to 6 nodes is also recommended as a general practice.
    *   **MQTT Schema**: [MQTT](./mqtt.md) schema v2 is required for firmware 0.3.8 and all subsequent versions. Refer to the `mqtt-export-schema` sample documentation for details.

### TeaBuddy Product Information

*   **MQTT Support**: The [TeaBuddy](./teabuddy.md) device does not support [MQTT](./mqtt.md) export.
*   **Connectivity**: [TeaBuddy](./teabuddy.md) operates as a BLE (Bluetooth Low Energy) app-only device.

## Related Entities

*   **Aurora Nova Widget v2 beta**: The primary product discussed, experiencing [MeshSync](./meshsync.md) and [MQTT](./mqtt.md) export issues.
*   **[SenseNode](./sensenode.md)**: A comparative product mentioned for its simpler topology and Cloud Subscription model.
*   **[TeaBuddy](./teabuddy.md)**: A separate product with specific connectivity limitations (BLE (Bluetooth Low Energy) app-only, no [MQTT](./mqtt.md)).
*   **[Home Assistant](./home-assistant.md)**: A popular homelab automation platform where [MQTT](./mqtt.md) export issues were observed.

## Related Concepts

*   **[MeshSync](./meshsync.md)**: A mesh networking technology used by Aurora Nova Widget v2 beta, designed to operate without a Cloud Subscription but with potential Scalability and Complexity.
*   **[MQTT (Message Queuing Telemetry Transport)](./mqtt.md)**: A lightweight messaging protocol used for IoT devices, enabling data export to platforms like Home Assistant.
*   **Firmware Upgrade**: Essential for resolving known bugs and enabling new features, such as the fix for [MeshSync](./meshsync.md) rejoin loops and compatibility with [MQTT](./mqtt.md) schema v2.
*   **Scalability and Complexity**: The inherent trade-off between managing a large number of devices in a mesh network versus simpler, potentially Cloud Subscription-based, topologies.
*   **Cloud Subscription**: An alternative model for device management and data reporting, often associated with simpler device topologies.
*   **BLE (Bluetooth Low Energy)**: A wireless personal area network technology, the sole connectivity method for devices like [TeaBuddy](./teabuddy.md).

## Sources

*   `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt`
*   `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt`

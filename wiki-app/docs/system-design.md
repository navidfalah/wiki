---
id: system-design
title: System Design
tags:
  - aurora
  - batch-update-all
  - ble-proxy-update
  - brick-scenario
  - ed25519
  - explicit-user-consent
  - mesh-wide-upgrade
  - meshsync-routing-table-invalidation
last_updated: "2026-06-25T08:01:34.348609+00:00"
sidebar_label: System Design
slug: /system-design
---

# System Design

## Overview

System Design encompasses the process of defining the architecture, modules, interfaces, and data for a system to satisfy specified requirements. This page, drawing from an [Over-the-Air (OTA) Updates](./over-the-air-updates.md) design sketch for the [Nova Widget](./nova-widget.md), illustrates specific considerations within the broader field of system design, focusing on firmware updates in a mesh network environment.

## Key Details

The provided design sketch for Over-the-Air (OTA) updates for the Nova Widget highlights critical aspects of system design for connected devices:

### OTA Update Design (Nova Widget)

*   **Requirements**:
    *   [Firmware Images](./firmware-images.md) must be cryptographically signed using `ed25519` for authenticity and integrity.
    *   The system must incorporate [Rollback Protection](./rollback-protection.md) mechanisms, especially after a [Mesh-wide Upgrade](./mesh-wide-upgrade.md), to prevent devices from reverting to vulnerable or incompatible firmware versions.
    *   A [BLE Proxy Update](./ble-proxy-update.md) mechanism is required, allowing updates via a phone application when a mesh node is otherwise unreachable.
*   **Risks**:
    *   A "[Brick Scenario](./brick-scenario.md)" is a significant risk, particularly if a parent node fails during a firmware push, potentially rendering child nodes inoperable.
    *   [MeshSync Routing Table Invalidation](./meshsync-routing-table-invalidation.md) is a concern during the flashing process, which could disrupt network communication.
*   **Open Questions**:
    *   A key design decision is whether [Explicit User Consent](./explicit-user-consent.md) for each individual node or if a [Batch Update](./batch-update.md) approach is acceptable.

### Related Notes

*   [Sam Rivera](./sam-rivera.md)'s [TeaBuddy](./teabuddy.md) project utilizes a simpler single-device BLE [DFU (Device Firmware Update)](./dfu-device-firmware-update.md) approach and has offered to share their test harness.
*   The [Aurora](./aurora.md) project has deferred its [Over-the-Air (OTA) Updates](./over-the-air-updates.md) implementation.

## Related Entities

*   **Nova Widget**: The primary device for which the OTA update design sketch was created.
*   **TeaBuddy**: A project that uses a simpler single-device BLE DFU.
*   **Sam Rivera**: Author of the TeaBuddy project, offered to share test harness.
*   **Aurora**: A project that has deferred its OTA update implementation.

## Related Concepts

*   **Over-the-Air (OTA) Updates**: The process of wirelessly distributing new firmware or software to devices.
*   **Firmware Images**: The software that provides low-level control for a device's specific hardware.
*   **ed25519**: A public-key signature system used for signing firmware images, ensuring their authenticity and integrity.
*   **Rollback Protection**: A security feature that prevents a device from being downgraded to an older, potentially vulnerable, firmware version.
*   **BLE Proxy Update**: Using a Bluetooth Low Energy connection, often through a mobile device, to facilitate updates for devices that are not directly reachable by other means.
*   **Mesh-wide Upgrade**: An update process that targets all or a significant portion of devices within a mesh network simultaneously.
*   **Brick Scenario**: A state where a device becomes permanently inoperable due to a failed update or other critical error.
*   **MeshSync Routing Table Invalidation**: The disruption or corruption of the routing information within a mesh network, potentially occurring during critical operations like firmware flashing.
*   **Explicit User Consent**: Requiring direct approval from the user before performing an action, such as a firmware update.
*   **Batch Update**: Updating multiple devices simultaneously without individual confirmation for each.
*   **DFU (Device Firmware Update)**: A general term for updating the firmware of a device.

## Contradictions

No contradictions were identified in the provided source material.

## Sources

*   `samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md`

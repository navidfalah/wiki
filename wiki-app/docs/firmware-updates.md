---
id: firmware-updates
title: Firmware Updates
tags:
  - aurora
  - aurora-labs
  - aurora-nova-widget
  - aurora-nova-widget-v2-beta
  - batch-update-all
  - beta-invite-batch
  - ble-app-only
  - ble-proxy-update
last_updated: "2026-06-25T07:23:13.073730+00:00"
sidebar_label: Firmware Updates
slug: /firmware-updates
---

# Firmware Updates

## Overview

Firmware updates are crucial for enhancing the functionality, stability, and security of [Aurora Labs](./aurora-labs.md) products, particularly the [Aurora Nova Widget](./aurora-nova-widget.md) and its [MeshSync](./meshsync.md) capabilities. These updates address known issues, introduce new features, and improve overall performance. While [Over-the-Air (OTA) Updates](./ota-updates.md) are a planned feature, specific versions like MeshSync 0.3.8 have been released to beta users, requiring manual flashing or addressing issues through support channels.

## Key Details

### MeshSync Firmware 0.3.8

*   **Release Date**: 2026-07-02
*   **Owners**: Mira Chen (firmware), Jonah Park (QA sign-off)
*   **Highlights**:
    *   **Rejoin Storm Mitigation**: Addresses a known issue (since beta) where meshes exceeding 6 nodes experienced rejoin storms.
    *   **Parent Election Logging**: Exports RSSI and hop count via debug UART for improved diagnostics.
    *   **Power Spike Reduction**: Reduced power spike on rejoin from 340µA to 180µA, though still above the 110µA target.
*   **Breaking Changes**:
    *   **Default Read Interval**: Confirmed at **15 minutes**, correcting earlier kickoff slides that incorrectly stated an hourly interval.
    *   **MQTT Export Schema v2**: This new schema is optional for local brokers but is required for firmware 0.3.8 and later.
*   **Known Issues (with 0.3.8)**:
    *   **Mesh Instability**: Meshes with 8 or more nodes may still experience instability in field reports (ticket #2099). Users are recommended to stay at 6 nodes until further patches.
    *   **[Battery Life](./battery-life.md) Discrepancy**: Engineering estimates 18 months at 10 nodes, while marketing materials may still claim 2 years.
*   **Impact**:
    *   Addressed duplicate MQTT messages during rejoin storms, a known issue on 0.3.7.
    *   Beta invite batch #3 for the [Aurora Nova Widget](./aurora-nova-widget.md) specifically instructed users to flash 0.3.8 before adding more than 6 nodes.

### [Over-the-Air (OTA) Updates](./ota-updates.md) Design Sketch

*   **Author**: Mira Chen
*   **Date**: 2026-07-04
*   **Status**: NOT SHIPPING IN BETA (as of the design sketch date).
*   **Requirements**:
    *   **Firmware Signing (ed25519)**: Utilizes ed25519 for secure firmware authenticity.
    *   **Rollback Protection**: Ensures system stability after a mesh-wide upgrade.
    *   **BLE Proxy Update**: Allows updates via a phone app when a mesh node is unreachable, leveraging Bluetooth Low Energy (BLE).
*   **Risks**:
    *   **Brick Scenario**: Potential for device bricking if a parent node fails during the update push.
    *   **Routing Table Invalidation**: Risk of [MeshSync](./meshsync.md) routing table invalidation during the flashing process.
*   **Open Question**: Whether [Over-the-Air (OTA) Updates](./ota-updates.md) should require explicit user consent per node or allow a Batch Updates option.

### General Update Information

*   The [Aurora Nova Widget](./aurora-nova-widget.md) v2 beta is the product context for these updates.
*   TeaBuddy devices use a simpler single-device BLE DFU (Device Firmware Update) mechanism, which was offered to Aurora but deferred. TeaBuddy devices are BLE app-only and do not support MQTT.

## Related Entities

*   **Aurora Nova Widget**: The primary product receiving firmware updates.
*   **Aurora Labs**: The company developing the firmware.
*   **Mira Chen**: Firmware owner for MeshSync 0.3.8 and author of the OTA update design sketch.
*   **Jonah Park**: QA sign-off for MeshSync 0.3.8.
*   **Sam Rivera**: Mentioned in relation to TeaBuddy's DFU and its irrelevance to Aurora v1 scope.
*   **[SenseNode](./sensenode.md)**: A competitor mentioned for its simpler topology and subscription model, contrasted with MeshSync's complexity at scale.
*   **GitHub aurora-labs/meshsync #442**: Channel for reporting issues.
*   **[Support Tickets](./support-tickets.md)**:
    *   **#2099**: MeshSync rejoin loop (addressed by 0.3.8).
    *   **#2210**: MQTT Home Assistant setup (resolved by upgrading to 0.3.8 and using v2 schema).
    *   **#1042**: Related to waterproofing.
    *   **#2101**: Related to battery math documentation errors.

## Related Concepts

*   **MeshSync**: The core mesh networking technology for Aurora devices.
*   **Over-the-Air (OTA) Updates**: The planned method for future firmware distribution.
*   **BLE Proxy Update**: A specific mechanism for OTA updates via a mobile app.
*   **Firmware Signing (ed25519)**: A security measure for authenticating firmware images.
*   **Rollback Protection**: A safety feature to prevent system failure after an update.
*   **Rejoin Storm Mitigation**: A fix for network instability in larger mesh networks.
*   **MQTT Export Schema**: The data format for exporting sensor data via MQTT.
*   **Default Read Interval**: The frequency at which devices report data.
*   **Power Spike Reduction**: An optimization for power consumption during network events.
*   **Parent Election Logging**: Diagnostic feature for mesh network topology.
*   **Battery Life**: A critical performance metric affected by firmware.
*   **Batch Updates**: The concept of updating multiple devices simultaneously.

## Contradictions

*   **Battery Life Estimates**:
    *   **Contradiction:** Engineering estimates 18 months of battery life for 10 nodes, while marketing materials may still state 2 years. This discrepancy should be clarified for users.

## Sources

*   `dummy-test/2026-07-02-aurora-meshsync-release-notes.md`
*   `samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md`
*   `samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt`
*   `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt`
*   `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt`

---
id: technical-specifications
title: Technical Specifications
tags:
  - aurora-labs
  - nova-widget
  - nrf52840
  - meshsync
  - cr2032
  - ble
  - ip-rating
  - iot-sensors
last_updated: "2026-06-25T08:03:39.280759+00:00"
sidebar_label: Technical Specifications
slug: /technical-specifications
---

```markdown
# Technical Specifications

## Overview

[Aurora Labs](./aurora-labs.md) is dedicated to creating open IoT sensors that empower users with data ownership, moving away from short-lived, cloud-dependent devices. The flagship product, the [Nova Widget](./nova-widget.md), is designed for home gardeners and small-acreage farmers, focusing on essential environmental monitoring with robust, long-lasting performance.

## Key Details

### Nova Widget v1 Scope
The initial version of the Nova Widget focuses on core environmental sensing and local data management:
*   **Sensors**:
    *   Soil moisture (capacitive)
    *   Air temperature
    *   Ambient light (simple photodiode)
*   **Connectivity**:
    *   [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./bluetooth-low-energy.md)) for initial phone setup.
    *   Custom mesh networking protocol ([MeshSync](./meshsync.md)) for range extension between nodes.
*   **Data Management**: Export CSV or MQTT only; no subscription cloud dashboard.

### Hardware
*   **Microcontroller (MCU)**: nRF52840
*   **Power**: Designed for 2 years of operation on a single [CR2032](./cr2032.md) coin cell battery with hourly readings.
*   **Enclosure**:
    *   Beta units: 3D printed PETG.
    *   Future production: Injection molded.
*   **Durability**: IP54 rating, which provides protection against dust and splashing water. (Note: A competitor, [SenseNode](./sensenode.md), offers IP67 waterproofing).

### Connectivity & Protocols
*   Bluetooth Low Energy (BLE): Used for initial device setup via a smartphone.
*   MeshSync: A custom mesh networking protocol developed by Aurora Labs for inter-node communication and range extension. The Nova Widget uses the dedicated MeshSync garden app.

### Software & Firmware
*   **Known Issues (Nova Widget)**:
    *   **Rejoin Loop (Ticket #2099)**: A known issue that can be resolved by updating to firmware version 0.3.8 and limiting the network to a maximum of six nodes.
*   **Known Issues ([TeaBuddy Puck](./teabuddy-puck.md))**:
    *   **iOS 18 Pairing**: Fixed in firmware version 0.9.3.
    *   **TB-142 Cancel Bug**: Can be resolved by performing a long-press reset.

### Non-Goals for v1
To maintain focus and deliver a robust core product, the following features are explicitly excluded from Nova Widget v1:
*   No camera
*   No GPS
*   No subscription cloud dashboard (data export via CSV/MQTT only)

## Related Entities

*   **[Aurora Labs](./aurora-labs.md)**: The company developing the [Nova Widget](./nova-widget.md).
*   **[Nova Widget](./nova-widget.md)**: The primary product, an open sensor for home gardeners.
*   **[TeaBuddy Puck](./teabuddy-puck.md)**: Another product (from a different company) that uses a [BLE](./bluetooth-low-energy.md) kitchen app, mentioned in cross-ticket support scenarios.
*   **[SenseNode](./sensenode.md)**: A competitor product known for its IP67 waterproofing.
*   **[Alex](./alex.md)**: An individual whose blog previously contained a typo regarding battery type.
*   **[Mira Chen](./mira-chen.md)**: Firmware, [MeshSync](./meshsync.md), power profiling lead.
*   **[Jonah Park](./jonah-park.md)**: PCB, sensors, mechanical lead.

## Related Concepts

*   **[Data Ownership](./data-ownership.md)**: A core mission of [Aurora Labs](./aurora-labs.md), emphasizing user control over their sensor data.
*   **[IoT Sensors](./iot-sensors.md)**: The category of devices [Nova Widget](./nova-widget.md) belongs to, focusing on environmental monitoring.
*   **[BLE](./bluetooth-low-energy.md) ([Bluetooth Low Energy](./bluetooth-low-energy.md))**: A wireless technology used for short-range communication and device setup.
*   **[Mesh Networking](./mesh-networking.md)**: A network topology where devices connect directly, extending range and reliability.
*   **[MeshSync](./meshsync.md)**: [Aurora Labs](./aurora-labs.md)' proprietary [Mesh Networking](./mesh-networking.md) protocol.
*   **[IP Rating](./ip-rating.md) (Ingress Protection)**: A standard defining the level of sealing effectiveness of electrical enclosures against intrusion from foreign bodies (dust, water, etc.). [Nova Widget](./nova-widget.md) is IP54.
*   **[CR2032](./cr2032.md)**: A common coin cell battery type used in the [Nova Widget](./nova-widget.md).

## Contradictions

*   **Battery Type**: There was a previous typo in "[Alex](./alex.md)'s blog" mentioning CR2450. This has been corrected; the [Nova Widget](./nova-widget.md) uses a **[CR2032](./cr2032.md)** battery.

## Sources

*   `notes/2026-05-01-kickoff-notes.md`
*   `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt`
```

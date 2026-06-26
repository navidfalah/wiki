---
id: iot-product-development
title: IoT Product Development
tags:
  - iot-product-development
  - aurora-labs
  - nova-widget
  - data-ownership
  - mesh-networking
  - firmware-development
  - low-power-design
  - cr2032
last_updated: "2026-06-25T07:31:19.789260+00:00"
sidebar_label: IoT Product Development
slug: /iot-product-development
---

```markdown
# IoT Product Development

## Overview

IoT Product Development involves the design, creation, and deployment of interconnected devices that collect and exchange data. This process encompasses hardware design, [Firmware Development](./Firmware Development.md), connectivity solutions, power management, and user experience considerations. A notable example is the "[Nova Widget](./Nova Widget.md)" project by [Aurora Labs](./Aurora Labs.md), which aims to address common frustrations with existing IoT sensors, such as short battery life and reliance on proprietary cloud services.

## Key Details

### [Aurora Labs](./Aurora Labs.md) and the [Nova Widget](./Nova Widget.md)

*   **Founders:** [Mira Chen](./Mira Chen.md) and [Jonah Park](./Jonah Park.md), who met at a local maker faire, initiated Aurora Labs.
*   **Motivation:** Frustration with existing IoT sensors that often have short lifespans (e.g., 6 months) and require mandatory cloud accounts, leading to a lack of [Data Ownership](./Data Ownership.md) for users.
*   **Mission Statement (Draft):** "Open sensors for people who own their data."
*   **Product Idea:** The "Nova Widget," an IoT sensor designed for home gardeners and small-acreage farmers.

### [Nova Widget](./Nova Widget.md) v1 Scope

The initial version of the Nova Widget focuses on essential functionalities:

*   **Sensors:**
    *   Capacitive soil moisture
    *   Air temperature
    *   Simple photodiode for ambient light
*   **Connectivity:**
    *   Bluetooth Low Energy (BLE) for initial setup via a smartphone.
    *   Custom [Mesh Networking](./Mesh Networking.md) protocol, codenamed **[MeshSync](./MeshSync.md)**, for range extension between nodes.
*   **Power Target:** Designed for a 2-year battery life using a [CR2032](./CR2032.md) coin cell, with hourly sensor readings.
*   **Enclosure:** Beta units will use 3D-printed PETG, with plans for injection molding in later stages.

### Non-Goals for Nova Widget v1

To maintain focus and achieve the core mission, several features were explicitly excluded from the first version:

*   No camera functionality.
*   No GPS capabilities.
*   No subscription-based cloud dashboard; data export will be available via CSV or MQTT only, emphasizing user data ownership.

### Technical Decisions

*   **Microcontroller (MCU):** [nRF52840](./nRF52840.md), chosen for its BLE capabilities and [Low-Power Design](./Low-Power Design.md) features.
*   **Mesh Protocol:** A custom protocol named **MeshSync**, to be prototyped by Mira Chen.
*   **Battery:** CR2032 coin cell, central to the 2-year power target.

### Team Roles

*   **Mira Chen:** Responsible for firmware development, the MeshSync protocol, and power profiling.
*   **Jonah Park:** Focuses on PCB design, sensor integration, and mechanical aspects of the enclosure.

## Related Entities

*   **[Aurora Labs](./Aurora Labs.md):** The company developing the [Nova Widget](./Nova Widget.md).
*   **[Nova Widget](./Nova Widget.md):** The specific IoT product under development.
*   **[Mira Chen](./Mira Chen.md):** Co-founder and lead on firmware and MeshSync.
*   **[Jonah Park](./Jonah Park.md):** Co-founder and lead on hardware and mechanical design.
*   **[MeshSync](./MeshSync.md):** The custom mesh networking protocol.
*   **[nRF52840](./nRF52840.md):** The chosen microcontroller.
*   **[CR2032](./CR2032.md):** The specified battery type.

## Related Concepts

*   **[Data Ownership](./Data Ownership.md):** A core principle of the Aurora Labs mission, empowering users to control their sensor data.
*   **[Mesh Networking](./Mesh Networking.md):** A key connectivity solution for extending the range of IoT devices without relying solely on a central hub.
*   **[Firmware Development](./Firmware Development.md):** The process of writing embedded software for microcontrollers.
*   **[Low-Power Design](./Low-Power Design.md):** Critical for achieving extended battery life in IoT devices.
*   **[Open Hardware/Software](./Open Hardware_Software.md):** Implied by the "open sensors" mission, promoting transparency and user control.

## Contradictions

No contradictions were identified in the provided source material.

## Sources

*   `notes/2026-05-01-kickoff-notes.md`
```

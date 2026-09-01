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

IoT Product Development involves the design, creation, and deployment of interconnected devices that collect and exchange data. This process encompasses hardware design, Firmware Development, connectivity solutions, power management, and user experience considerations. A notable example is the "Nova Widget" project by Aurora Labs, which aims to address common frustrations with existing IoT sensors, such as short battery life and reliance on proprietary cloud services.

## Key Details

### Aurora Labs and the Nova Widget

*   **Founders:** Mira Chen and Jonah Park, who met at a local maker faire, initiated Aurora Labs.
*   **Motivation:** Frustration with existing IoT sensors that often have short lifespans (e.g., 6 months) and require mandatory cloud accounts, leading to a lack of Data Ownership for users.
*   **Mission Statement (Draft):** "Open sensors for people who own their data."
*   **Product Idea:** The "Nova Widget," an IoT sensor designed for home gardeners and small-acreage farmers.

### Nova Widget v1 Scope

The initial version of the Nova Widget focuses on essential functionalities:

*   **Sensors:**
    *   Capacitive soil moisture
    *   Air temperature
    *   Simple photodiode for ambient light
*   **Connectivity:**
    *   Bluetooth Low Energy (BLE) for initial setup via a smartphone.
    *   Custom Mesh Networking protocol, codenamed **MeshSync**, for range extension between nodes.
*   **Power Target:** Designed for a 2-year battery life using a CR2032 coin cell, with hourly sensor readings.
*   **Enclosure:** Beta units will use 3D-printed PETG, with plans for injection molding in later stages.

### Non-Goals for Nova Widget v1

To maintain focus and achieve the core mission, several features were explicitly excluded from the first version:

*   No camera functionality.
*   No GPS capabilities.
*   No subscription-based cloud dashboard; data export will be available via CSV or MQTT only, emphasizing user data ownership.

### Technical Decisions

*   **Microcontroller (MCU):** nRF52840, chosen for its BLE capabilities and Low-Power Design features.
*   **Mesh Protocol:** A custom protocol named **MeshSync**, to be prototyped by Mira Chen.
*   **Battery:** CR2032 coin cell, central to the 2-year power target.

### Team Roles

*   **Mira Chen:** Responsible for firmware development, the MeshSync protocol, and power profiling.
*   **Jonah Park:** Focuses on PCB design, sensor integration, and mechanical aspects of the enclosure.

## Related Entities

*   **Aurora Labs:** The company developing the Nova Widget.
*   **Nova Widget:** The specific IoT product under development.
*   **Mira Chen:** Co-founder and lead on firmware and MeshSync.
*   **Jonah Park:** Co-founder and lead on hardware and mechanical design.
*   **MeshSync:** The custom mesh networking protocol.
*   **nRF52840:** The chosen microcontroller.
*   **CR2032:** The specified battery type.

## Related Concepts

*   **Data Ownership:** A core principle of the Aurora Labs mission, empowering users to control their sensor data.
*   **Mesh Networking:** A key connectivity solution for extending the range of IoT devices without relying solely on a central hub.
*   **Firmware Development:** The process of writing embedded software for microcontrollers.
*   **Low-Power Design:** Critical for achieving extended battery life in IoT devices.
*   **Open Hardware/Software:** Implied by the "open sensors" mission, promoting transparency and user control.

## Contradictions

No contradictions were identified in the provided source material.

## Sources

*   `notes/2026-05-01-kickoff-notes.md`
```

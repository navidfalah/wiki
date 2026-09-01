---
id: startup-kickoff
title: Startup Kickoff
tags:
  - aurora-labs
  - cr2032
  - data-ownership
  - firmware-development
  - jonah-park
  - mesh-networking
  - meshsync
  - mira-chen
last_updated: "2026-06-25T08:01:04.605766+00:00"
sidebar_label: Startup Kickoff
slug: /startup-kickoff
---

# Startup Kickoff

## Overview

The initial kickoff meeting for [Aurora Labs](./aurora-labs.md) took place on May 1, 2026, in Mira Chen's garage workshop in Portland, OR. The meeting brought together co-founders Mira Chen and Jonah Park, who shared a common frustration with existing Internet of Things (IoT) sensors that often have short lifespans and require proprietary cloud accounts. The primary outcome was the establishment of Aurora Labs with a draft mission statement focused on open data ownership and the initial scoping of their first product, the [Nova Widget](./nova-widget.md).

## Key Details

### Company & Mission
*   **Company Name:** Aurora Labs (suggested by Jonah Park, agreed by Mira Chen). The name was chosen to evoke "dawn, new beginning."
*   **Mission Statement (Draft):** "Open sensors for people who own their data." This reflects the founders' desire to create IoT devices that are user-centric and avoid mandatory cloud subscriptions.

### Product Idea: Nova Widget
*   **Working Name:** Nova Widget
*   **Target Users:** Home gardeners and small-acreage farmers.
*   **v1 Scope (Agreed):**
    *   Soil moisture (capacitive sensor)
    *   Air temperature
    *   Ambient light (simple photodiode)
    *   [Bluetooth Low Energy (BLE)](./bluetooth-low-energy-ble.md) for phone setup
    *   [Mesh networking](./mesh-networking.md) between nodes for range extension
*   **v1 Non-Goals:**
    *   No camera functionality
    *   No GPS capabilities
    *   No subscription-based cloud dashboard (data export via CSV or [MQTT](./mqtt.md) only)

### Technical Decisions
*   **Microcontroller Unit (MCU):** nRF52840 (Jonah Park already possesses development boards for this MCU).
*   **Mesh Protocol:** A custom protocol, codenamed **[MeshSync](./meshsync.md)**, will be developed. Mira Chen is tasked with prototyping this.
*   **Power Target:** The device is designed to operate for 2 years on a single CR2032 coin cell battery, with hourly readings.
*   **Enclosure:** Initial beta units will use 3D-printed PETG enclosures, with plans for injection molding in later stages.

### Roles
*   Mira Chen: Responsible for firmware development, the MeshSync protocol, and power profiling.
*   Jonah Park: Responsible for PCB design, sensor integration, and mechanical design.

### Action Items
*   Mira Chen: Develop a MeshSync proof-of-concept by May 15.
*   Jonah Park: Order capacitive soil probes (vendor to be determined).
*   Both: Revisit battery life calculations after the initial sleep profile is established.

## Related Entities

*   **Mira Chen:** Co-founder of Aurora Labs, responsible for firmware development, MeshSync, and power profiling.
*   **Jonah Park:** Co-founder of Aurora Labs, responsible for PCB design, sensors, and mechanical design.
*   **Aurora Labs:** The startup company founded by Mira Chen and Jonah Park.

## Related Concepts

*   **CR2032:** A common coin cell battery type targeted for the Nova Widget's 2-year power life.
*   **[Data Ownership](./data-ownership.md):** A core principle of Aurora Labs' mission, emphasizing user control over their sensor data.
*   **Firmware Development:** A key responsibility of Mira Chen, particularly for the nRF52840 MCU and MeshSync.
*   **Mesh Networking:** A critical feature for the Nova Widget to extend sensor range between nodes using the custom MeshSync protocol.
*   **MeshSync:** The codename for Aurora Labs' custom mesh networking protocol.
*   **nRF52840:** The chosen microcontroller unit (MCU) for the Nova Widget.
*   **Nova Widget:** The working name for Aurora Labs' first product, an open sensor for gardeners and farmers.

## Contradictions

No contradictions were identified in the provided source material.

## Sources

*   `notes/2026-05-01-kickoff-notes.md`

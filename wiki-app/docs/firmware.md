---
id: firmware
title: Firmware
tags:
  - firmware
  - meshsync
  - ota
  - 15-min-interval
  - nrf52840
  - nova-widget
  - hardware-revision-c
  - hobbyist-market
last_updated: "2026-06-25T07:23:19.111446+00:00"
sidebar_label: Firmware
slug: /firmware
---

# Firmware

## Overview

Firmware refers to the embedded software that provides low-level control for a device's specific hardware. In the context of the Nova Widget, the firmware is built around the MeshSync protocol, managing device operations, data collection, and communication. It is designed to run on an nRF52840 microcontroller and interfaces with components like the capacitive soil probe.

## Key Details

*   **Core Protocol**: The firmware primarily utilizes **MeshSync**.
    *   The baseline version specified for hardware revision C is **MeshSync 0.3.8**.
*   **Default Interval**: The default operational interval for data transmission or reporting is **15 minutes**.
*   **Over-The-Air (OTA) Updates**: OTA firmware updates are currently **deferred**, indicating they are planned for future implementation but not active.
*   **Hardware Platform**: The firmware operates on an **nRF52840** microcontroller unit (MCU).
*   **Sensor Integration**: It is designed to interface with a **capacitive soil probe** (30mm length).
*   **Product Context**: This firmware is integral to the Nova Widget, including variants targeted at the **hobbyist market**.

## Related Entities

*   **Nova Widget**: The primary product line utilizing this firmware.
*   **nRF52840**: The microcontroller unit (MCU) on which the firmware runs.
*   **Capacitive Soil Probe**: A key sensor managed by the firmware.
*   **CR2032 Battery**: The power source for devices running this firmware.
*   **Hardware Revision C**: A specific hardware iteration that defines the firmware baseline.

## Related Concepts

*   **MeshSync**: The underlying communication and synchronization protocol used by the firmware.
*   **Over-The-Air (OTA) Updates**: A method for wirelessly updating firmware, currently deferred for this implementation.
*   **Embedded Systems**: The broader field of computer systems designed for specific control functions within a larger mechanical or electrical system.
*   **Hobbyist Market**: The target audience for some Nova Widget variants, influencing design and cost considerations.

## Contradictions

No contradictions were found in the provided source material.

## Sources

*   `articles/TEST-product-brief.md`
*   `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md`

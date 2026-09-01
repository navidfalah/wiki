---
id: teabuddy
title: TeaBuddy
tags:
  - teabuddy
  - ble
  - firmware
  - ios-18
  - corebluetooth
  - battery
  - codebase-merging
  - ux
last_updated: "2026-06-25T08:01:56.994847+00:00"
sidebar_label: TeaBuddy
slug: /teabuddy
---

# TeaBuddy

## Overview

TeaBuddy is a device that utilizes Bluetooth Low Energy (BLE) for connectivity. Its functionality is managed through [Firmware](./firmware.md), which undergoes regular updates to address bugs, improve performance, and introduce new features. Key aspects include its battery management, user experience (UX) features like haptics, and integration with mobile applications.

## Key Details

*   **Connectivity:**
    *   Uses Bluetooth Low Energy (BLE) for communication.
    *   Does *not* use [MeshSync](./meshsync.md), which is a protocol employed by other devices like the [Aurora Nova Widget](./aurora-nova-widget.md).
    *   The codebase for TeaBuddy is distinct and should not be merged with projects using MeshSync, as advised by Sam Rivera.
*   **Firmware & Updates:**
    *   **v0.9.4 (2026-07-01):**
        *   Fixed TB-142: Timer continued after cancellation in the associated app (fix by Sam Rivera).
        *   Increased BLE pairing timeout to 45 seconds, specifically for iOS 18 beta compatibility.
        *   Aligned the herbal preset constant to 7:00, correcting a previous marketing copy discrepancy of 5:00.
    *   **v0.9.3 (2026-06-28):**
        *   Implemented a fix for the CoreBluetooth permission prompt order (ticket #2156).
        *   Capped the haptic motor duty cycle at 70% following a UX review by Alex Kim.
    *   **v0.9.2 (2026-06-20):**
        *   Introduced a box QR pairing path for TestFlight builds.
        *   Reduced [CR2032 battery](./cr2032-battery.md) sleep current draw from 12µA to 9µA.
*   **Hardware & Power:**
    *   Powered by a CR2032 battery.
    *   The sleep current draw for the CR2032 battery is 9µA (after v0.9.2 update).
    *   Features a haptic motor.
*   **User Experience:**
    *   Includes a timer function.
    *   Has an "Herbal" preset, set to 7:00.
    *   BLE pairing can be initiated via a QR code on the device's box.

## Related Entities

*   **Sam Rivera:** Contributed to fixing a timer bug (TB-142) and advised against merging TeaBuddy's codebase with MeshSync-based projects.
*   **Alex Kim:** Conducted a UX review that led to capping the haptic motor duty cycle.
*   **Aurora Nova Widget:** A separate device that uses MeshSync, highlighting the distinction in connectivity protocols and codebase for TeaBuddy.
*   **iOS 18 beta:** Required an increase in BLE pairing timeout for TeaBuddy.

## Related Concepts

*   **Bluetooth Low Energy (BLE):** The primary wireless communication protocol used by TeaBuddy.
*   **CoreBluetooth:** The iOS framework utilized for managing BLE connections and permissions.
*   **Firmware:** The embedded software that controls TeaBuddy's operations, subject to regular updates.
*   **User Experience (UX)::** Considerations for device interaction, including haptics and app integration.
*   **Battery Life Optimization:** Efforts to reduce power consumption, such as lowering sleep current draw.
*   **Codebase Merging:** The process of combining different software projects, specifically noted as undesirable between TeaBuddy and MeshSync-based devices.

## Contradictions

*   **Herbal Preset Duration:** The herbal preset constant in the firmware was aligned to 7:00, correcting earlier marketing copy that stated 5:00.
*   **Battery Type:** While TeaBuddy uses a CR2032 battery, some external documentation incorrectly referred to CR2450.

## Sources

*   `dummy-test/2026-07-01-firmware-changelog.md`
*   `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md`

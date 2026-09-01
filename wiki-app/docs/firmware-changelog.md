---
id: firmware-changelog
title: Firmware Changelog
tags:
  - alex-kim
  - aurora-nova-widget
  - ble-pairing-timeout
  - box-qr-pairing-path
  - corebluetooth
  - corebluetooth-permission-prompt-order
  - cr2032
  - firmware-changelog
last_updated: "2026-06-25T07:22:17.439082+00:00"
sidebar_label: Firmware Changelog
slug: /firmware-changelog
---

# Firmware Changelog

## Overview

This page details the changelog for the [TeaBuddy](./teabuddy.md) firmware, specifically covering the v0.9.x series. It outlines various bug fixes, performance improvements, and feature adjustments implemented across different versions.

## Key Details

### Version 0.9.4 (Released 2026-07-01)

*   **Timer Fix**: Resolved issue TB-142, where the timer continued to run after being canceled in the application. (Credit: Sam Rivera)
*   **BLE Pairing Timeout**: Increased the Bluetooth Low Energy (BLE) Pairing timeout to 45 seconds to improve compatibility with iOS 18 beta.
*   **Herbal Preset Alignment**: Adjusted the "Herbal" preset constant to 7:00.

### Version 0.9.3 (Released 2026-06-28)

*   **CoreBluetooth Permissions**: Fixed the permission prompt order for CoreBluetooth interactions (ticket #2156).
*   **Haptic Motor Duty Cycle**: Capped the Haptic Motor duty cycle at 70% following a UX review conducted by Alex Kim.

### Version 0.9.2 (Released 2026-06-20)

*   **QR Pairing Path**: Introduced a box QR Pairing path, primarily for TestFlight builds.
*   **CR2032 Sleep Draw**: Reduced the CR2032 battery's Sleep Draw from 12µA to 9µA, improving battery life.

## Related Entities

*   **TeaBuddy**: The product whose firmware is being updated.
*   **Sam Rivera**: Contributed to fixing the timer issue (TB-142).
*   **Alex Kim**: Performed a UX review that led to the haptic motor duty cycle adjustment.
*   **iOS 18 beta**: A specific operating system version that required an adjustment to the BLE pairing timeout.
*   **CoreBluetooth**: Apple's framework for interacting with Bluetooth Low Energy devices.
*   **Aurora Nova Widget**: A separate product that utilizes [MeshSync](./meshsync.md) and does not share codebase with TeaBuddy.

## Related Concepts

*   **Bluetooth Low Energy (BLE) Pairing**: The process of establishing a connection between two BLE devices.
*   **Haptic Motor**: A component that provides tactile feedback through vibrations.
*   **CR2032**: A common type of coin cell lithium battery.
*   **Sleep Draw**: The amount of electrical current consumed by a device when it is in a low-power sleep state.
*   **TestFlight**: Apple's platform for distributing beta versions of applications to testers.
*   **QR Pairing**: A method of initiating device pairing by scanning a Quick Response (QR) code.
*   **MeshSync**: A synchronization technology used by the Aurora Nova Widget.

## Contradictions

*   **Contradiction:** The "Herbal" preset constant was documented as 5:00 in marketing copy but was actually 7:00 in the firmware prior to v0.9.4. This discrepancy was resolved in firmware v0.9.4 by aligning the firmware value to 7:00.

## Sources

*   `dummy-test/2026-07-01-firmware-changelog.md`

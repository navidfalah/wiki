---
id: bluetooth-low-energy-ble
title: Bluetooth Low Energy (BLE)
tags:
  - bluetooth-low-energy
  - ble-pairing
  - ios-18
  - teabuddy
  - firmware
  - corebluetooth
  - android
  - power-management
last_updated: "2026-06-25T07:13:55.993752+00:00"
sidebar_label: Bluetooth Low Energy (BLE)
slug: /bluetooth-low-energy-ble
---

# Bluetooth Low Energy (BLE)

## Overview

Bluetooth Low Energy (BLE) is a wireless personal area network technology designed for low power consumption while maintaining a similar communication range to classic Bluetooth. It is a critical component for many modern smart devices, enabling connectivity with smartphones and other peripherals.

## Key Details

### BLE Pairing and Connectivity

*   **iOS 18 Compatibility**:
    *   The BLE pairing timeout was increased to 45 seconds specifically for [iOS 18](./ios-18.md) beta devices in [TeaBuddy](./teabuddy.md) [firmware](./firmware.md) v0.9.4 to improve reliability.
    *   iOS 18 beta introduced changes to the [CoreBluetooth](./corebluetooth.md) permission prompt order, which caused issues (ticket #2156) where [`CBManagerAuthorization`](./cbmanagerauthorization.md) needed to resolve before a [QR Deep Link](./qr-deep-link.md) could trigger a [GATT (Generic Attribute Profile)](./gatt.md) connection.
    *   Firmware v0.9.3 addressed the CoreBluetooth permission prompt order issue.
    *   Future [Android](./android.md) development should learn from these iOS 18 changes to avoid similar ordering mistakes.
*   **QR Pairing**: A box QR pairing path was implemented for TestFlight builds (firmware v0.9.2), facilitating initial device setup.

### Firmware Enhancements (TeaBuddy Specific)

*   **v0.9.4 (2026-07-01)**:
    *   Fixed an issue (TB-142) where the timer continued after being canceled in the app.
    *   Increased BLE pairing timeout to 45 seconds for iOS 18 beta.
    *   Aligned the herbal preset constant to 7:00 (previously 5:00 in marketing copy, a contradiction fixed in firmware).
*   **v0.9.3 (2026-06-28)**:
    *   Implemented a fix for the CoreBluetooth permission prompt order (ticket #2156).
    *   Capped the haptic motor duty cycle at 70% following an [Alex Kim](./alex-kim.md) UX review.
*   **v0.9.2 (2026-06-20)**:
    *   Introduced a TestFlight build with a box QR pairing path.
    *   Reduced [CR2032](./cr2032.md) battery sleep current draw from 12µA to 9µA.

### Background Operations

*   Background steep timers require [`UIBackgroundTask`](./uibackgroundtask.md) renewal to prevent termination, addressing a "TB-background-kill" bug.

## Related Entities

*   **TeaBuddy**: A device that utilizes BLE for connectivity, with specific firmware updates addressing BLE-related issues.
*   **iOS 18**: An [Apple](./apple.md) operating system version that introduced changes affecting BLE pairing and CoreBluetooth permissions.
*   **Apple**: The developer of iOS and CoreBluetooth framework.
*   **[Sam Rivera](./sam-rivera.md)**: Author of research notes on iOS 18 CoreBluetooth pairing changes and contributor to TeaBuddy firmware.
*   **Alex Kim**: Performed a UX review that influenced haptic motor duty cycle adjustments in TeaBuddy firmware.
*   **[Aurora Nova Widget](./aurora-nova-widget.md)**: A separate product that uses UART provisioning and [MeshSync](./meshsync.md), not sharing the same BLE consumer QR flow codebase as TeaBuddy.
*   **Android**: Another mobile operating system platform where BLE implementation considerations are relevant.

## Related Concepts

*   **CoreBluetooth**: Apple's framework for interacting with Bluetooth Low Energy devices.
*   **GATT (Generic Attribute Profile)**: A specification that defines how two BLE devices transfer data back and forth.
*   **QR Deep Link**: A mechanism to initiate device pairing or setup via scanning a QR code.
*   **`CBManagerAuthorization`**: An authorization status related to CoreBluetooth manager.
*   **`UIBackgroundTask`**: An iOS API used to request extra execution time for tasks in the background.
*   **Firmware**: Embedded software that controls the hardware of a device, such as TeaBuddy.
*   **MeshSync**: A synchronization technology used by Aurora Nova Widget, distinct from TeaBuddy's BLE implementation.
*   **CR2032**: A common type of lithium coin cell battery, used in devices like TeaBuddy.

## Contradictions

No direct contradictions about Bluetooth Low Energy (BLE) were found in the provided sources.

## Sources

*   `dummy-test/2026-07-01-firmware-changelog.md`
*   `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md`

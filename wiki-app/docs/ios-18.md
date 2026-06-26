---
id: ios-18
title: iOS 18
tags:
  - android
  - apple
  - beta-release-notes
  - ble-pairing
  - cbmanagerauthorization
  - gatt-connect
  - ios-18
  - nova-widget
last_updated: "2026-06-25T07:30:23.160541+00:00"
sidebar_label: iOS 18
slug: /ios-18
---

# iOS 18

## Overview

iOS 18 introduces significant changes to CoreBluetooth pairing, particularly affecting the order of permission prompts. These changes have impacted applications relying on Bluetooth Low Energy (BLE) connections, leading to issues such as a specific problem identified as TeaBuddy ticket #2156. A key alteration requires `CBManagerAuthorization` to be resolved before a QR deep link can initiate a GATT (Generic Attribute Profile) connection. Additionally, background processes, such as steep timers, now necessitate `UIBackgroundTask` renewal to prevent termination.

## Key Details

*   **Permission Prompt Order Change**: The iOS 18 beta altered the sequence in which permission prompts appear for Bluetooth operations.
*   **`CBManagerAuthorization` Prerequisite**: For BLE pairing flows, `CBManagerAuthorization` must successfully resolve its status before any QR deep link can trigger a GATT connect operation. Failure to adhere to this order can prevent successful connections.
*   **Impact on QR Deep Links**: Applications using QR codes for deep linking into a GATT connect process are directly affected by the new permission order.
*   **Background Task Management**: Background steep timers, which likely manage ongoing background operations, now require explicit `UIBackgroundTask` renewal to ensure they are not prematurely terminated by the operating system. This change addresses a "TB-background-kill bug."
*   **Identified Issues**: These changes led to TeaBuddy ticket #2156, indicating a specific problem encountered by the TeaBuddy application.
*   **Resolution and Prevention**:
    *   A fix was planned for shipment in version 0.9.3 to address the identified issues.
    *   Documentation for Android development teams was recommended to prevent similar ordering mistakes in cross-platform implementations.
*   **Aurora Relevance**: The changes have minimal relevance for the Nova Widget, as it primarily uses UART provisioning for device setup rather than the consumer-facing QR deep link flow for BLE pairing.

## Related Entities

*   **Apple**: The developer of iOS 18 and CoreBluetooth framework.
*   **TeaBuddy**: An application or system impacted by the iOS 18 CoreBluetooth changes, leading to ticket #2156.
*   **Nova Widget**: A component or application within the Aurora ecosystem that uses UART provisioning, making it less affected by the BLE pairing changes.

## Related Concepts

*   **Bluetooth Low Energy (BLE)**: A wireless personal area network technology designed for low power consumption.
*   **CoreBluetooth**: Apple's framework for interacting with Bluetooth Low Energy devices.
*   **GATT Connect**: The process of establishing a connection to a Bluetooth Low Energy device's Generic Attribute Profile, which defines how data is exchanged.
*   **QR Deep Link**: A QR code that, when scanned, directs the user to a specific section or action within a mobile application.
*   **`CBManagerAuthorization`**: An authorization status within CoreBluetooth that indicates whether the app has permission to use Bluetooth.
*   **`UIBackgroundTask`**: An API in iOS that allows applications to request extra time to complete tasks in the background.
*   **UART Provisioning**: A method of configuring or setting up a device using a Universal Asynchronous Receiver-Transmitter (UART) interface, typically a wired serial connection.

## Contradictions

No contradictions were found in the provided source material.

## Sources

*   `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md`

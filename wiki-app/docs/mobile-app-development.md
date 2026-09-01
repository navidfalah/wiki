---
id: mobile-app-development
title: Mobile App Development
tags:
  - android
  - apple
  - beta-release-notes
  - ble-pairing
  - cbmanagerauthorization
  - gatt-connect
  - mobile-app-development
  - nova-widget
last_updated: "2026-06-25T07:42:06.929842+00:00"
sidebar_label: Mobile App Development
slug: /mobile-app-development
---

# Mobile App Development

## Overview

Mobile app development often involves navigating platform-specific changes and ensuring robust functionality across different operating systems. Recent updates, such as the [iOS 18](./ios-18.md) beta, have introduced significant changes to core system behaviors, particularly concerning Bluetooth Low Energy (BLE) pairing and background task management. These changes can impact existing applications, requiring developers to adapt their implementation to maintain user experience and stability.

## Key Details

*   **[iOS 18](./ios-18.md) CoreBluetooth Changes:** The [iOS 18](./ios-18.md) beta introduced modifications to the permission prompt order for CoreBluetooth operations. This change specifically affected the [TeaBuddy](./teabuddy.md) app, leading to ticket #2156.
*   **Permission Resolution Order:** For applications utilizing BLE, it is critical that `CBManagerAuthorization` is resolved and granted *before* a QR Deep Link attempts to trigger a GATT (Generic Attribute Profile) connect. Failing to adhere to this order can prevent successful BLE connections.
*   **Background Task Management:** Background processes, such as a "steep timer" in the [TeaBuddy](./teabuddy.md) app, require proper `UIBackgroundTask` renewal to prevent the operating system from terminating the app in the background. This addresses a "TB-background-kill" bug.
*   **Impact and Solutions:**
    *   A fix (version 0.9.3) was planned and/or shipped for the [TeaBuddy](./teabuddy.md) app to address these issues.
    *   Lessons learned from these [iOS 18](./ios-18.md) changes are to be documented for Android development kickoffs to prevent similar implementation mistakes on other platforms.
*   **Aurora Relevance:** The [Nova Widget](./nova-widget.md), a related entity, is minimally affected by these specific [iOS 18](./ios-18.md) BLE pairing changes because it utilizes UART Provisioning rather than a consumer-facing QR Deep Link flow for device setup.

## Related Entities

*   **[TeaBuddy](./teabuddy.md):** An application directly impacted by [iOS 18](./ios-18.md) CoreBluetooth changes, leading to specific bug fixes and development considerations.
*   **[Nova Widget](./nova-widget.md):** A component or application that uses UART Provisioning, making it less susceptible to issues related to QR deep links and BLE pairing Permission Prompts flows.
*   **Apple:** The developer of [iOS 18](./ios-18.md), responsible for platform updates like [iOS 18](./ios-18.md) that necessitate app adaptations.
*   **Android:** Another major mobile operating system, where similar Permission Prompts ordering mistakes are to be avoided based on [iOS 18](./ios-18.md) learnings.

## Related Concepts

*   **Bluetooth Low Energy (BLE):** A wireless personal area network technology used for connecting devices, central to the pairing issues discussed.
*   **CoreBluetooth:** Apple's framework for interacting with Bluetooth Low Energy devices on [iOS 18](./ios-18.md).
*   **`CBManagerAuthorization`:** An authorization status that must be resolved for CoreBluetooth operations to proceed.
*   **GATT Connect:** The process of establishing a connection to a Bluetooth Low Energy device's Generic Attribute Profile.
*   **`UIBackgroundTask`:** An [iOS 18](./ios-18.md) API used to request additional execution time for tasks when an app moves to the background, crucial for preventing background termination.
*   **QR Deep Link:** A QR Deep Link that, when scanned, directs the user to a specific location within a mobile application, potentially triggering actions like BLE pairing.
*   **UART Provisioning:** A method of configuring or setting up a device using a Universal Asynchronous Receiver-Transmitter (UART) interface, an alternative to BLE-based provisioning.
*   **Permission Prompts:** User interface elements that request Permission Prompts for an app to access system resources or perform certain actions.

## Contradictions

No contradictions were found in the provided source material.

## Sources

*   `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md`

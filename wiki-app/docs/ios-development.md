---
id: ios-development
title: iOS Development
tags:
  - ble
  - corebluetooth
  - pairing
  - ios-18-beta
  - testflight
  - firmware
  - ux-review
  - teabuddy
last_updated: "2026-06-25T07:30:38.124134+00:00"
sidebar_label: iOS Development
slug: /ios-development
---

# iOS Development

## Overview

iOS development, in the context of connected devices, involves creating applications that interact seamlessly with hardware. This often includes managing [BLE (Bluetooth Low Energy)](./ble-bluetooth-low-energy.md) connections, handling permissions, implementing [UX Review](./ux-review.md) features like [Haptic Feedback](./haptic-feedback.md), and ensuring compatibility with various iOS versions and testing platforms like [TestFlight](./testflight.md). [Firmware](./firmware.md) updates on companion devices frequently address issues or introduce features that directly impact the iOS application's functionality and user experience.

## Key Details

*   **BLE Pairing Timeout**: For devices interacting with iOS 18 beta, the [BLE (Bluetooth Low Energy)](./ble-bluetooth-low-energy.md) [Pairing](./pairing.md) timeout was increased to 45 seconds. This adjustment likely accommodates changes or specific requirements within the iOS 18 beta environment to ensure successful device [Pairing](./pairing.md).
*   **CoreBluetooth Permissions**: A fix was implemented to address the order in which [CoreBluetooth](./corebluetooth.md) permission prompts appear. This ensures a smoother and more compliant user experience when an iOS application requests Bluetooth access.
*   **Pairing Paths**: A "box QR [Pairing](./pairing.md) path" was introduced for [TestFlight](./testflight.md) builds. This suggests a streamlined method for users to pair devices during beta testing, potentially by scanning a QR code on the device packaging directly from the iOS app.
*   **Haptic Motor Duty Cycle**: The duty cycle for a device's [haptic motor](./haptic-feedback.md) was capped at 70% following a [UX Review](./ux-review.md) conducted by [Alex Kim](./alex-kim.md). This indicates that user experience considerations, often driven by how the device interacts with its iOS companion app, directly influence hardware performance parameters.
*   **Timer Bug Fix**: A bug where a timer continued to run after being canceled within the iOS application was fixed by [Sam Rivera](./sam-rivera.md). This highlights the importance of robust app logic for managing device states and user interactions.
*   **CR2032 Sleep Draw**: The sleep current draw for devices using CR2032 batteries was reduced from 12µA to 9µA. While primarily a [Firmware](./firmware.md) optimization, this can impact the overall user experience by extending battery life for devices paired with iOS.
*   **Herbal Preset Constant**: A discrepancy between marketing copy (5:00) and [Firmware](./firmware.md) (7:00) for an [Herbal Preset Constant](./herbal-preset-constant.md) was resolved in the [Firmware](./firmware.md), aligning it to 7:00.

## Related Entities

*   **Alex Kim**: Conducted a [UX Review](./ux-review.md) that led to the capping of the [haptic motor](./haptic-feedback.md) duty cycle.
*   **Aurora Nova Widget**: A separate product that utilizes [MeshSync](./meshsync.md), explicitly noted as not sharing a codebase with the [TeaBuddy](./teabuddy.md), but mentioned in a cross-reference context.
*   **Sam Rivera**: Developer responsible for fixing a timer bug within the application.
*   **TeaBuddy**: The primary product whose [Firmware](./firmware.md) changelog provides the context for these iOS development-related updates, indicating a device designed to interact with iOS applications.

## Related Concepts

*   **BLE (Bluetooth Low Energy)**: The fundamental wireless technology used for communication between iOS devices and connected hardware, with specific [Pairing](./pairing.md) timeout adjustments for iOS 18 beta.
*   **CoreBluetooth**: Apple's framework for interacting with [Bluetooth Low Energy](./ble-bluetooth-low-energy.md) devices on iOS, with specific attention to permission prompt order.
*   **Firmware**: The embedded software on a device that often requires updates to ensure compatibility and optimal interaction with iOS applications.
*   **Haptic Feedback**: Tactile feedback provided by a device's motor, with its behavior (e.g., duty cycle) influenced by [UX Review](./ux-review.md) considerations and iOS app control.
*   **Pairing**: The process of establishing a wireless connection between a device and an iOS device, with specific methods like QR code [Pairing](./pairing.md) implemented for ease of use.
*   **TestFlight**: Apple's platform for distributing beta versions of iOS applications, indicating that new features and fixes are often tested in this environment.
*   **UX Review**: A process focused on improving user experience, which can lead to adjustments in both hardware behavior and iOS application design.
*   **MeshSync**: A technology used by a related product ([Aurora Nova Widget](./aurora-nova-widget.md)), indicating broader ecosystem considerations in development.

## Contradictions

*   **Herbal Preset Constant**: The marketing copy for an [Herbal Preset Constant](./herbal-preset-constant.md) stated 5:00, while the [Firmware](./firmware.md) initially had it set to 7:00. This was resolved by aligning the [Firmware](./firmware.md) constant to 7:00.

## Sources

*   `dummy-test/2026-07-01-firmware-changelog.md`

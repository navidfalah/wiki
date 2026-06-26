---
id: software-bugs
title: Software Bugs
tags:
  - software-bugs
  - beta-release
  - mesh-networking
  - ble-pairing
  - ios-18
  - android-development
  - background-processes
  - firmware-updates
last_updated: "2026-06-25T07:57:55.743246+00:00"
sidebar_label: Software Bugs
slug: /software-bugs
---

# Software Bugs

## Overview

Software bugs are errors or flaws in a computer program or system that cause it to produce an incorrect or unexpected result, or to behave in unintended ways. They can range from minor glitches to critical failures, often requiring fixes through software updates or workarounds. This page details specific instances of software bugs encountered in mesh networking and Bluetooth Low Energy (BLE) pairing contexts.

## Key Details

### Meshsync Rejoin Storm

A persistent issue, labeled as a `bug`, `power`, and `beta` problem, was reported in the `aurora-labs/meshsync` project.

*   **Issue Description**: Users experienced multi-hour periods of silence in the mesh network after adding an 8th node. This "rejoin storm" persisted even after flashing all units with version 0.3.8.
*   **Version Affected**: 0.3.8.
*   **Status**: Open, with ongoing investigation.
*   **Workaround**: Users were advised to cap the network at 6 nodes to avoid the issue.
*   **Resolution Path**: A fix is planned for the 0.3.9 milestone, which includes a rewrite of the parent election mechanism.
*   **Related Feedback**: One user noted that 0.3.8 was an improvement but did not fully resolve the problem, highlighting the complexity of mesh networks.

### iOS 18 CoreBluetooth Pairing Changes

Changes introduced in the iOS 18 beta release led to a specific bug related to BLE pairing and background processes.

*   **Issue Description**: The permission prompt order in iOS 18 beta was altered, causing a bug (TeaBuddy ticket #2156) where `CBManagerAuthorization` needed to resolve *before* a QR deep link could successfully trigger a GATT connect.
*   **Background Task Bug**: A separate issue, dubbed the "TB-background-kill bug," required `UIBackgroundTask` renewal for background steep timers to prevent unexpected termination.
*   **Aurora Relevance**: This specific pairing flow bug has minimal direct impact on Aurora's Nova Widget, as it utilizes UART provisioning rather than a consumer-facing QR deep link flow for initial setup.
*   **Action Items**:
    *   A fix (version 0.9.3) was planned for the affected system (TeaBuddy).
    *   The findings were to be documented for Android development kickoff to prevent similar ordering mistakes in other platforms.
*   **Sources**: The findings were based on analysis of Apple beta release notes and internal TestFlight crash logs.

## Related Entities

*   **aurora-labs/meshsync**: GitHub repository where the rejoin storm bug was reported.
*   **TeaBuddy**: Company or product affected by the iOS 18 BLE pairing changes.
*   **Apple**: Developer of iOS 18, which introduced changes impacting BLE pairing.
*   **SenseNode**: A user or product mentioned in the context of mesh network complexity.

## Related Concepts

*   **Beta Release**: Software versions released for testing before general availability, often containing bugs.
*   **BLE Pairing**: The process of establishing a secure connection between two Bluetooth Low Energy devices.
*   **GATT Connect**: The Generic Attribute Profile (GATT) connection process in BLE, used for data exchange.
*   **Background Tasks**: Processes that run in the background on mobile operating systems, requiring specific permissions and management.
*   **Node Limits**: The maximum number of devices that can reliably operate within a mesh network.
*   **UART Provisioning**: A method of configuring devices, often used in embedded systems, via a Universal Asynchronous Receiver-Transmitter interface.
*   **Permission Management**: The system by which operating systems control access to device resources and functionalities.

## Contradictions

No direct contradictions were found between the provided source materials.

## Sources

*   `samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt`
*   `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md`

---
id: ota-updates
title: OTA Updates
tags:
  - aurora
  - batch-update-all
  - ble-proxy-update
  - brick-scenario
  - ed25519
  - explicit-user-consent
  - mesh-wide-upgrade
  - meshsync-routing-table-invalidation
last_updated: "2026-06-25T07:45:09.808863+00:00"
sidebar_label: OTA Updates
slug: /ota-updates
---

# OTA Updates

## Overview

Over-The-Air (OTA) updates refer to the wireless delivery of new firmware or software to devices. This page synthesizes a design sketch for OTA updates specifically for the "Nova Widget" product. As of the design sketch date (2026-07-04), this feature was not planned for beta release.

## Key Details

### Requirements

The design sketch outlines several critical requirements for OTA updates:

*   **Signed Firmware Images:** All firmware images must be cryptographically signed using ed25519 to ensure authenticity and integrity.
*   **Rollback Protection:** Mechanisms must be in place to prevent firmware rollbacks after a successful mesh-wide upgrade, ensuring devices always run the intended version.
*   **BLE Proxy Update:** The system must support updating mesh nodes via a phone application using a Bluetooth Low Energy (BLE) proxy, particularly when a mesh node is otherwise unreachable.

### Risks

Potential risks identified during the design phase include:

*   **Brick Scenario:** There is a risk of devices becoming "bricked" (unresponsive) if a parent node fails or loses power during a firmware push operation.
*   **MeshSync Routing Table Invalidation:** The process of flashing new firmware could potentially invalidate the MeshSync routing table, leading to temporary network disruption.

### Open Questions

A key open question regarding user experience and deployment strategy is:

*   Should OTA updates require explicit user consent for each individual node, or should there be an option for a batch "update all" operation?

### Related Notes

*   Sam Rivera, associated with the TeaBuddy project, has experience with simpler single-device BLE DFU (Device Firmware Update) and offered to share a test harness.
*   The Aurora project or team deferred on this specific OTA update approach.

## Related Entities

*   **Nova Widget:** The product for which this OTA update design sketch was created.
*   **Mira Chen:** Author of the OTA update design sketch.
*   **Sam Rivera:** Individual who offered insights on BLE DFU.
*   **Aurora:** A project or team mentioned in the context of deferring on this OTA approach.
*   **TeaBuddy:** A project or product context for Sam Rivera's work.

## Related Concepts

*   **ed25519:** A public-key signature system used for signing firmware images.
*   **Mesh-wide upgrade:** The process of updating firmware across an entire mesh network.
*   **BLE Proxy Update:** Using a Bluetooth Low Energy connection, often through a smartphone, to facilitate updates for devices in a mesh network.
*   **Brick Scenario:** A state where a device becomes permanently unusable due to a failed update or other critical error.
*   **MeshSync Routing Table Invalidation:** The disruption or corruption of network routing information within a mesh network.
*   **Explicit User Consent:** Requiring direct user approval for an action.
*   **Batch Update:** Applying an update to multiple devices simultaneously.
*   **BLE DFU (Device Firmware Update):** A standard method for updating firmware on Bluetooth Low Energy devices.

## Contradictions

No contradictions were found in the provided source material.

## Sources

*   `samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md`

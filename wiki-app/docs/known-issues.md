---
id: known-issues
title: Known Issues
tags:
  - aurora-labs
  - default-read-interval
  - jonah-park
  - known-issues
  - meshsync
  - mira-chen
  - mqtt-export-schema-v2
  - nova-widget
last_updated: "2026-06-25T07:32:32.310074+00:00"
sidebar_label: Known Issues
slug: /known-issues
---

# Known Issues

This page compiles known issues and ongoing challenges identified within Aurora Labs products, primarily focusing on the MeshSync firmware. These issues range from stability concerns in larger mesh networks to discrepancies in product specifications and performance targets.

## Overview

Known issues are identified problems or limitations that have been acknowledged by the development and QA teams. While some issues may have mitigations in place, others are still under investigation or represent areas where performance targets have not yet been fully met. This document highlights critical issues, particularly those affecting MeshSync firmware version 0.3.8 and related components like the Nova Widget.

## Key Details

### Mesh Stability
*   **Unstable Networks (8+ nodes):** MeshSync networks with 8 or more nodes continue to exhibit instability in field reports. This is an ongoing issue, tracked under ticket #2099.
*   **Rejoin Storms:** While mitigation efforts have been implemented for rejoin storms in meshes exceeding 6 nodes (a known issue since beta), the instability in larger networks suggests the problem is not fully resolved.

### Battery Life
*   **Target Discrepancy:** Engineering estimates for battery life are 18 months when operating with 10 nodes. This is lower than the 2-year battery life that marketing materials may still communicate.

### Power Consumption
*   **Rejoin Power Spike:** The power spike observed during node rejoin events has been reduced from 340µA to 180µA. However, this is still above the target of 110µA.

### Default Read Interval
*   **Fixed at 15 Minutes:** The default read interval for MeshSync remains 15 minutes. Earlier kickoff slides incorrectly stated an hourly interval. Users should be aware that the 15-minute interval is the current and intended default.

### MQTT Export Schema
*   **Version 2 (Optional):** MeshSync firmware 0.3.8 introduces MQTT export schema v2. This is an optional feature and is currently supported only with a local broker.

## Related Entities

*   **Aurora Labs:** The company developing MeshSync firmware and related products.
*   **Mira Chen:** Firmware owner for MeshSync.
*   **Jonah Park:** QA sign-off for MeshSync firmware 0.3.8.
*   **Sam Rivera:** Inquired about TeaBuddy integration with MeshSync (feature deemed out of scope for Aurora v1).

## Related Concepts

*   **MeshSync:** Firmware for mesh networking devices, specifically version 0.3.8.
*   **Nova Widget:** A product or component associated with MeshSync.
*   **Rejoin Storm:** A phenomenon where multiple nodes attempt to rejoin a mesh network simultaneously, potentially causing instability.
*   **Battery Life:** The expected operational duration of a device on battery power.
*   **Power Spike:** A temporary, significant increase in electrical current draw.
*   **Default Read Interval:** The pre-configured frequency at which a device performs data readings or operations.
*   **MQTT Export Schema v2:** A specific data format used for exporting data via the MQTT protocol.

## Contradictions

*   **Battery Life Expectation:**
    **Contradiction:** Engineering estimates for battery life are 18 months at 10 nodes, while marketing materials may still claim 2 years. This represents a discrepancy between internal technical assessment and external communication.

## Sources

*   `dummy-test/2026-07-02-aurora-meshsync-release-notes.md`

---
id: hardware-evaluation
title: Hardware Evaluation
tags:
  - hardware-evaluation
  - hop-count
  - jonah
  - mesh-quirks
  - meshsync
  - mira
  - nrf52840
  - nrf5340
last_updated: "2026-06-25T07:26:00.150951+00:00"
sidebar_label: Hardware Evaluation
slug: /hardware-evaluation
---

# Hardware Evaluation

## Overview
Hardware evaluation involves assessing the performance, power consumption, and suitability of different hardware components for specific applications, particularly within a Mesh Networking context. This process often includes comparing different chipsets, monitoring network behavior, and identifying potential issues that could impact system stability or efficiency.

## Key Details
*   **Chipset Comparison**: A key action item for future revisions is to compare the nRF52840 and nRF5340 chipsets. This comparison is crucial for determining the optimal hardware for the next iteration of the system, likely focusing on performance, power efficiency, and mesh networking capabilities.
*   **Mesh Network Behavior**:
    *   **Rejoin Storms**: Debugging sessions, such as a MeshSync session involving Mira and Jonah, have identified persistent "Rejoin Storm" issues, even with 8 nodes. These storms can significantly impact network stability and performance.
    *   **Current Consumption Spikes**: During a parent swap within the mesh network, a notable Current Consumption spike was observed, increasing from 110µA to 340µA. This power consumption characteristic is a critical factor in hardware evaluation, especially for battery-powered devices.
    *   **Diagnostic Logging**: To better understand mesh network dynamics, it was suggested to log every rejoin event, including associated RSSI (Received Signal Strength Indicator) and Hop Count. These metrics are vital for assessing network health and routing efficiency.
    *   **Parent/Child Role Ambiguity**: A fundamental question regarding mesh network architecture, "Parent/Child Roles? WHO DECIDES???", highlights potential ambiguities or complexities in how roles are assigned and managed, which can influence hardware requirements and software design.
*   **Related Initiatives**:
    *   A wiki page titled "known mesh quirks v0.3" is planned, suggesting ongoing efforts to document and address specific behaviors or issues within the mesh network.
    *   Capturing a 24-hour trace on a staging mesh is an action item to gather long-term data for analysis.
*   **Feature Requests**: The "teabuddy team" inquired about the mesh network's ability to sync tea timers across a house. This feature was explicitly rejected for version 1 ("absolutely not v1"), indicating current limitations or priorities that might influence future hardware considerations.

## Related Entities
*   **Mira**: An individual involved in the MeshSync debug session.
*   **Jonah**: An individual involved in the MeshSync debug session.
*   **MeshSync**: A system or protocol being debugged, central to the mesh network operations.
*   **nRF52840**: A specific Nordic Semiconductor chipset under consideration for evaluation.
*   **nRF5340**: Another specific Nordic Semiconductor chipset under consideration for evaluation, likely a successor or alternative to the nRF52840.

## Related Concepts
*   **Mesh Networking**: The underlying technology enabling devices to communicate in a decentralized network.
*   **Hop Count**: A metric indicating the number of intermediate nodes a data packet travels through to reach its destination.
*   **RSSI**: A measurement of the power present in a received radio signal, used to assess signal quality and proximity.
*   **Current Consumption**: The amount of electrical current drawn by a device, critical for battery life and power management.
*   **Rejoin Storm**: A scenario where multiple nodes repeatedly attempt to rejoin the network, often due to instability or poor connectivity.
*   **Parent/Child Roles**: The hierarchical relationships between nodes in some mesh network topologies.

## Contradictions
No explicit contradictions were identified in the provided source material.

## Sources
*   `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt`

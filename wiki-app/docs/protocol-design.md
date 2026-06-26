---
id: protocol-design
title: Protocol Design
tags:
  - protocol-design
  - meshsync
  - network-protocols
  - configuration
  - roles
  - deprecated-features
  - integration
last_updated: "2026-06-25T07:54:12.408467+00:00"
sidebar_label: Protocol Design
slug: /protocol-design
---

```markdown
# Protocol Design

## Overview

Protocol design involves defining the rules, formats, and procedures for communication between entities in a system. This includes specifying data structures, operational parameters, roles, and interaction mechanisms. The MeshSync protocol, for example, illustrates several key aspects of protocol design, including node limits, communication intervals, role definitions, and mechanisms for parent election.

## Key Details

The MeshSync protocol, as detailed in its v0.3 header, defines several critical parameters and structures:

*   **Node Limits**:
    *   `MESHSYNC_MAX_NODES`: The maximum number of nodes supported within a MeshSync network is 32.
    *   `MESHSYNC_BETA_SAFE_NODES`: A specific limit of 6 nodes is designated as "beta safe," likely for testing or early deployment scenarios.
*   **Communication Interval**:
    *   `MESHSYNC_DEFAULT_INTERVAL_MIN`: The default communication interval for MeshSync operations is set to 15 minutes.
    *   **Deprecated Feature**: An hourly interval, previously used, has been deprecated in favor of `MESHSYNC_DEFAULT_INTERVAL_MIN`.
*   **Node Roles**:
    *   The `meshsync_role_t` enumeration defines the possible roles a node can assume within the MeshSync network:
        *   `MESHSYNC_ROLE_PARENT`: A node acting as a parent in the network hierarchy.
        *   `MESHSYNC_ROLE_CHILD`: A node acting as a child, reporting to a parent.
        *   `MESHSYNC_ROLE_LOST`: A state indicating a node is attempting to rejoin the network, often referred to as a "rejoin storm state."
*   **Parent Election Mechanism**:
    *   Parent election in MeshSync is determined by an RSSI-weighted random backoff algorithm. Further details are documented in whiteboard discussions from July 3.
*   **Integration Requests**:
    *   An integration request with TeaBuddy was denied, as noted in a partnership memo.

## Related Entities

*   **Aurora**: A system or project context within which MeshSync operates.
*   **MeshSync**: A specific protocol designed for network synchronization, serving as a primary example of protocol design principles.
*   **TeaBuddy**: An external entity with whom an integration request was considered and subsequently denied.

## Related Concepts

*   **Network Protocols**: The fundamental rules governing data exchange in a computer network.
*   **Node Roles**: The specific functions or responsibilities assigned to individual participants within a network.
*   **Parent Election**: A process by which a network determines which node will act as a central coordinator or parent.
*   **RSSI (Received Signal Strength Indicator)**: A measurement of the power present in a received radio signal, often used in wireless network decisions.
*   **Random Backoff**: A strategy used in network protocols to avoid collisions by waiting a random amount of time before retransmitting data.
*   **Configuration Parameters**: Settings and values that define the operational characteristics of a protocol or system.
*   **Deprecated Features**: Functionality that is no longer recommended for use and may be removed in future versions.
*   **Integration**: The process of combining different systems or components to work together.

## Contradictions

No contradictions were identified in the provided source material.

## Sources

*   `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt`
```

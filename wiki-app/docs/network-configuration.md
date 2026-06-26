---
id: network-configuration
title: Network Configuration
tags:
  - aurora
  - deprecated-feature
  - integration-request
  - meshsync-beta-safe-nodes
  - meshsync-default-interval-min
  - meshsync-max-nodes
  - meshsync-role-child
  - meshsync-role-lost
last_updated: "2026-06-25T07:43:00.793634+00:00"
sidebar_label: Network Configuration
slug: /network-configuration
---

# Network Configuration

## Overview
This page details specific aspects of network configuration, particularly as they relate to the MeshSync protocol. The MeshSync protocol, currently at version v0.3, defines various parameters and roles for nodes within a network, influencing how devices discover, synchronize, and maintain their state.

## Key Details

### MeshSync Protocol Parameters
The MeshSync protocol defines several key parameters for network operation:

*   **Maximum Nodes (`MESHSYNC_MAX_NODES`)**: The network is designed to support a maximum of 32 nodes.
*   **Beta Safe Nodes (`MESHSYNC_BETA_SAFE_NODES`)**: A specific limit of 6 nodes is designated as "beta safe nodes," indicating a subset with potentially different operational characteristics or stability requirements.
*   **Default Synchronization Interval (`MESHSYNC_DEFAULT_INTERVAL_MIN`)**: The default synchronization interval for MeshSync operations is set to 15 minutes. An earlier hourly interval has been deprecated in favor of this 15-minute setting.

### Node Roles
Nodes participating in the MeshSync network can assume different roles, defined by the `meshsync_role_t` enumeration:

*   **`MESHSYNC_ROLE_PARENT`**: A node acting as a parent in the network hierarchy, responsible for coordinating child nodes.
*   **`MESHSYNC_ROLE_CHILD`**: A node acting as a child, typically reporting to or receiving instructions from a parent node.
*   **`MESHSYNC_ROLE_LOST`**: This state indicates a node is in a "rejoin storm" state, suggesting it is actively attempting to re-establish its connection or role within the network after being disconnected or losing its assigned role.

### Parent Election
The process for electing a parent node within the MeshSync network involves an RSSI-weighted random backoff mechanism. Further details on this mechanism were discussed on July 3.

### Integration Requests
An integration request concerning the TeaBuddy system was denied, as noted in a partnership memo.

## Related Entities
*   **Aurora**: A system or platform associated with the MeshSync protocol.
*   **TeaBuddy**: An external entity with whom an integration request was considered and subsequently denied.

## Related Concepts
*   **Protocol**: MeshSync defines a structured set of rules for communication and synchronization within a network.
*   **Deprecated Feature**: The hourly synchronization interval has been replaced by a more frequent 15-minute interval, indicating an evolution in best practices or requirements.
*   **Network Synchronization**: The process by which nodes maintain consistent state and data across the network, crucial for distributed systems.
*   **Node Management**: The handling of node roles, limits, and states within the network to ensure stable and efficient operation.
*   **Parent Election**: A mechanism for dynamically assigning leadership roles within a network, often based on specific criteria like signal strength (RSSI).

## Contradictions
*   The hourly synchronization interval for MeshSync operations is deprecated. The current standard is `MESHSYNC_DEFAULT_INTERVAL_MIN` (15 minutes). This represents an update to the specification rather than a direct contradiction of existing facts.

## Sources
*   `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt`

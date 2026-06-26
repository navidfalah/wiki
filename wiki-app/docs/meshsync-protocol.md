---
id: meshsync-protocol
title: MeshSync Protocol
tags:
  - aurora
  - deprecated-feature
  - integration-request
  - meshsync-beta-safe-nodes
  - meshsync-default-interval-min
  - meshsync-max-nodes
  - meshsync-protocol
  - meshsync-role-child
last_updated: "2026-06-25T07:41:22.196612+00:00"
sidebar_label: MeshSync Protocol
slug: /meshsync-protocol
---

# MeshSync Protocol

## Overview
The MeshSync Protocol is a communication protocol, primarily associated with the Aurora system, designed for network synchronization. It defines various operational parameters, node roles, and mechanisms for maintaining network coherence. The protocol has undergone revisions, with `v0.3` being an excerpted version, and includes specific limits and operational intervals.

## Key Details

*   **Node Limits**:
    *   `MESHSYNC_MAX_NODES`: The maximum number of nodes supported by the protocol is 32.
    *   `MESHSYNC_BETA_SAFE_NODES`: A specific limit of 6 nodes is designated as "beta safe nodes."

*   **Synchronization Interval**:
    *   `MESHSYNC_DEFAULT_INTERVAL_MIN`: The default synchronization interval is 15 minutes.
    *   **Deprecated Feature**: An earlier hourly interval for synchronization has been deprecated in favor of the `MESHSYNC_DEFAULT_INTERVAL_MIN`.

*   **Node Roles**: The protocol defines distinct roles for nodes within the mesh network, enumerated as `meshsync_role_t`:
    *   `MESHSYNC_ROLE_PARENT`: A node acting as a parent in the mesh.
    *   `MESHSYNC_ROLE_CHILD`: A node acting as a child, typically connected to a parent.
    *   `MESHSYNC_ROLE_LOST`: A state indicating a node is attempting to rejoin the network, often referred to as a "rejoin storm state."

*   **Parent Election Mechanism**: Parent nodes are elected using an "RSSI-weighted random backoff" algorithm. Further details on this mechanism were discussed in a whiteboard session on July 3.

*   **Integration Requests**: An integration request with TeaBuddy was formally denied, as documented in a partnership memo.

## Related Entities

*   **Aurora**: The primary system or platform with which the MeshSync Protocol is associated.
*   **TeaBuddy**: An external entity whose integration request with MeshSync was denied.

## Related Concepts

*   **Network Synchronization**: The core purpose of the MeshSync Protocol, ensuring data and state consistency across nodes.
*   **Parent Election**: A process by which a node is designated as a "parent" to manage or coordinate other nodes.
*   **RSSI-weighted random backoff**: A specific algorithm used for parent election, likely involving signal strength (RSSI) and a randomized delay to prevent collisions.
*   **Deprecated Feature**: The removal or discouragement of an older feature (hourly interval) in favor of a newer or more efficient one.

## Contradictions
No explicit contradictions were found in the provided source material.

## Sources
*   `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt`

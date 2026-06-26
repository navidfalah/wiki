---
id: node-management
title: Node Management
tags:
  - node management
  - meshsync
  - aurora-labs
  - beta release
  - rejoin storm
  - parent election
  - deprecated features
  - github issue
last_updated: "2026-06-25T07:43:31.971661+00:00"
sidebar_label: Node Management
slug: /node-management
---

```markdown
# Node Management

## Overview
Node Management refers to the processes and protocols governing how individual nodes operate within a MeshSync network, particularly concerning their roles, connectivity, and scaling. This includes defining maximum node capacities, handling node joins and departures, and managing communication intervals. Aurora-Labs' MeshSync protocol, currently in beta, has faced challenges related to network stability and performance when scaling beyond a certain number of nodes.

## Key Details

### Node Capacity and Limitations
*   **Maximum Nodes**: The MeshSync protocol defines `MESHSYNC_MAX_NODES` as 32.
*   **Beta Safe Nodes**: Due to ongoing issues, a `MESHSYNC_BETA_SAFE_NODES` limit of 6 is recommended as a workaround to maintain network stability.
*   **Scaling Issues**:
    *   Users have reported "rejoin storm" states and "multi-hour silence" when adding an 8th node, particularly with MeshSync version 0.3.8.
    *   This issue is categorized as a `bug`, `power`, and `beta` problem.
    *   While version 0.3.8 showed some improvement, the problem was not fully resolved.

### Node Roles and States
Nodes within the MeshSync network can assume specific roles:
*   `MESHSYNC_ROLE_PARENT`: A node acting as a central coordinator or primary communication point.
*   `MESHSYNC_ROLE_CHILD`: A node connected to a parent node.
*   `MESHSYNC_ROLE_LOST`: A state indicating a node is experiencing a "rejoin storm" and is attempting to re-establish its connection or role.

### Parent Election
*   The mechanism for electing a parent node is based on an "RSSI-weighted random backoff" algorithm.
*   A significant "Parent election rewrite" is planned for the 0.3.9 MeshSync milestone to address current stability issues.

### Communication Intervals
*   **Default Interval**: The `MESHSYNC_DEFAULT_INTERVAL_MIN` is set to 15 minutes.
*   **Deprecated Interval**: An "hourly interval" for communication has been deprecated.

### Integration Requests
*   An integration request for "TeaBuddy" was denied, as noted in a partnership memo.

## Related Entities
*   **Aurora-Labs**: The developer behind the MeshSync protocol.
*   **MeshSync**: The protocol and system governing node communication and management.
*   **SenseNode**: A competitor or alternative mentioned in user discussions regarding mesh complexity.
*   **potato99, mira-chen, meshfan, teaguy**: Users and contributors involved in discussions about node management issues.

## Related Concepts
*   **Rejoin Storm**: A state where nodes repeatedly attempt to rejoin the network, leading to instability and communication failures.
*   **Parent Election**: The process by which a node is designated as the primary coordinator within a segment of the mesh network.
*   **RSSI (Received Signal Strength Indicator)**: A measure of the power present in a received radio signal, used in parent election.
*   **Beta Release**: A software release phase where the product is tested by a limited audience before general availability, often identifying bugs and performance issues.
*   **Deprecated Features**: Features or functionalities that are no longer recommended for use and may be removed in future versions.

## Contradictions
No direct contradictions were found in the provided source material.

## Sources
*   `samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt`
*   `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt`
```

---
id: aurora-nova
title: Aurora Nova
tags:
  - alex
  - aurora-nova
  - battery-life
  - cr2450-cr2032
  - ip67
  - meshsync
  - mira
  - rejoin-issues
last_updated: "2026-06-25T07:12:23.754571+00:00"
sidebar_label: Aurora Nova
slug: /aurora-nova
---

# Aurora Nova

## Overview
The Aurora Nova is a widget or sensor device, often discussed in the context of home automation and sensor networks. It is notable for its integration with the [MeshSync](./meshsync.md) platform and its Subscription Models-free model. However, users have reported specific challenges, particularly concerning network stability with a higher number of devices and discrepancies in hardware specifications.

## Key Details

*   **MeshSync Integration**:
    *   Aurora Nova widgets are designed to operate with the [MeshSync](./meshsync.md) platform.
    *   Users have reported "rejoin issues" when running 8 or more Nova widgets on [MeshSync](./meshsync.md).
    *   A recommendation exists to limit the number of active Nova nodes to 6 until [MeshSync](./meshsync.md) version 0.3.8 is released, as acknowledged by Mira on GitHub issues.
*   **Subscription Model**:
    *   The Aurora Nova operates without requiring a subscription, which is considered an advantage over some competing products like [SenseNode](./sensenode.md).
*   **Environmental Rating**:
    *   Unlike some competitors (e.g., [SenseNode](./sensenode.md)), the Aurora Nova does not possess an IP Rating (IP67 rating), making it less suitable for outdoor or harsh environmental use.
*   **Battery Specifications**:
    *   There is conflicting information regarding the battery type used in Aurora Nova devices.
    *   Alex's blog reportedly states the use of a CR2450 battery.
    *   However, device teardowns have indicated the presence of a [CR2032 battery](./cr2032-battery.md).

## Related Entities

*   **[SenseNode](./sensenode.md)**: A competing sensor device, noted for its IP Rating (IP67 rating) and differing Subscription Models.
*   **[MeshSync](./meshsync.md)**: The [Mesh Networking](./mesh-networking.md) platform with which Aurora Nova widgets integrate.
*   **Mira**: A developer or contributor associated with [MeshSync](./meshsync.md), who has posted about Aurora Nova issues on GitHub.
*   **Alex**: An individual whose blog provided information on the Aurora Nova's battery type.

## Related Concepts

*   **[Mesh Networking](./mesh-networking.md)**: The underlying technology enabling Aurora Nova devices to communicate within a network.
*   **[Battery Life](./battery-life.md)**: A critical performance metric for wireless sensor devices, impacted by battery type and usage.
*   **IP Rating (Ingress Protection)**: A standard indicating the degree of protection against solids and liquids, relevant for device placement (indoor vs. outdoor).
*   **Subscription Models**: The business model for accessing device features or services, a key differentiator for Aurora Nova.

## Contradictions

*   **Battery Type**:
    *   **Contradiction:** Alex's blog claims the Aurora Nova uses a CR2450 battery, but device teardowns have revealed a [CR2032 battery](./cr2032-battery.md). This discrepancy could impact expected [Battery Life](./battery-life.md) and replacement part compatibility.

## Sources
*   `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt`

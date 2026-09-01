---
id: sensor-networks
title: Sensor Networks
tags:
  - aurora
  - cr2032
  - duty-cycle-limits
  - gateway
  - lorawan
  - meshsync
  - mira-chen
  - rejoin-spikes
last_updated: "2026-06-25T07:55:57.684210+00:00"
sidebar_label: Sensor Networks
slug: /sensor-networks
---

```markdown
# Sensor Networks

## Overview

Sensor networks are systems of spatially distributed sensors that monitor physical or environmental conditions, such as temperature, sound, vibration, pressure, motion, or pollutants, and cooperatively pass their data through the network to a main location. This page details a power consumption and Total Cost of Ownership (TCO) comparison between two common sensor network technologies: [LoRaWAN](./lorawan.md) and [MeshSync](./meshsync.md), based on research by Mira Chen.

## Key Details

The comparison focused on a scenario involving 10 sensor nodes and one gateway, with a sample interval of 15 minutes.

### [LoRaWAN](./lorawan.md) ([SenseNode](./sensenode.md)-class)

*   **Duty Cycle Limits:** [LoRaWAN](./lorawan.md) deployments in regions like the EU are subject to duty cycle limits. This can necessitate a longer effective sample interval or require higher peak power consumption to transmit data within the allowed windows.
*   **Gateway Power:** [LoRaWAN](./lorawan.md) networks typically require an always-on gateway, which consumes approximately 2W of wall power.

### [MeshSync](./meshsync.md) (Aurora)

*   **Node Power:** Each [MeshSync](./meshsync.md) node, specifically the Aurora model, is powered by a CR2032 coin cell battery.
*   **Rejoin Spikes:** A significant power consumption factor for [MeshSync](./meshsync.md) at scale is "Rejoin Spikes." These occur when nodes re-establish connections within the mesh network, leading to temporary increases in power draw. While version 0.3.8 of [MeshSync](./meshsync.md) improved this issue, it has not been fully resolved.

### Total Cost of Ownership (TCO)

Based on the comparison, [MeshSync](./meshsync.md) is concluded to offer a better TCO, primarily due to the absence of subscription fees and the lack of a dedicated gateway requiring wall power.

## Related Entities

*   **Mira Chen:** Author of the research comparing [LoRaWAN](./lorawan.md) and [MeshSync](./meshsync.md) power consumption.
*   **Aurora:** A specific implementation or product line utilizing [MeshSync](./meshsync.md) technology.
*   **[SenseNode](./sensenode.md):** A class of devices or a specific product line utilizing [LoRaWAN](./lorawan.md) technology.

## Related Concepts

*   **[LoRaWAN](./lorawan.md):** A Low Power Wide Area Network (LPWAN) specification for wireless battery-operated "things" in a regional, national or global network.
*   **[MeshSync](./meshsync.md):** A mesh networking technology for sensor nodes, designed for low power consumption.
*   **Duty Cycle:** The proportion of time that a system or component is active. In wireless communication, it refers to the percentage of time a device can transmit.
*   **Rejoin Spikes:** Temporary increases in power consumption experienced by mesh network nodes when re-establishing connections.
*   **Gateway:** A device that connects a [LoRaWAN](./lorawan.md) network to the internet or another back-end system.
*   **CR2032:** A common type of lithium coin cell battery.
*   **Total Cost of Ownership (TCO):** A financial estimate intended to help consumers and enterprise managers determine the direct and indirect costs of a product or system.

## Contradictions

An older research bookmark suggested that mesh networks always consume lower power than other technologies.
> **Contradiction:** This claim is false when considering deployments with 8 or more nodes today, as indicated by the recent power comparison.

## Sources

*   `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md`
```

---
id: power-consumption
title: Power Consumption
tags:
  - aurora
  - cr2032
  - duty-cycle-limits
  - gateway
  - lorawan
  - meshsync
  - mira-chen
  - power-consumption
last_updated: "2026-06-25T07:46:15.480992+00:00"
sidebar_label: Power Consumption
slug: /power-consumption
---

# Power Consumption

## Overview

This page synthesizes research on power consumption, primarily comparing [LoRaWAN](./LoRaWAN.md) and [MeshSync](./MeshSync.md) technologies for sensor networks. The analysis, conducted by [Mira Chen](./Mira%20Chen.md), highlights key differences in power draw, particularly concerning node-level power sources, [gateway](./Gateway.md) requirements, and network-specific behaviors like [duty cycle](./Duty%20Cycle.md) limits and rejoin events.

## Key Details

*   **Research Context:**
    *   **Author:** Mira Chen
    *   **Date:** 2026-07-06
    *   **Assumptions:** The comparison is based on a scenario involving 10 sensor nodes and one gateway, with a 15-minute sample interval.

*   **LoRaWAN (SenseNode-class):**
    *   **Duty Cycle:** EU regulations impose duty cycle limits, which can necessitate a longer effective sample interval or result in higher peak power consumption during transmission.
    *   **Gateway Power:** LoRaWAN systems typically require an always-on gateway, which consumes approximately 2W of wall power.

*   **MeshSync (Aurora):**
    *   **Node Power:** Each MeshSync node (e.g., [Aurora](./Aurora.md)) is powered by a [CR2032](./CR2032.md) coin cell battery.
    *   **Rejoin Spikes:** Network rejoin events can cause significant power consumption spikes, especially at scale. While version 0.3.8 of the MeshSync software improved this issue, it has not been fully resolved.

*   **Comparative Conclusion (Draft):**
    *   A preliminary conclusion suggests that MeshSync offers advantages in [Total Cost of Ownership](./Total%20Cost%20of%20Ownership.md) (TCO) due to the absence of subscription fees and the elimination of a gateway wall wart (external power adapter).

## Related Entities

*   **[Mira Chen](./Mira%20Chen.md):** Author of the comparative research.
*   **[SenseNode](./SenseNode.md):** A class of devices used in the [LoRaWAN](./LoRaWAN.md) comparison.
*   **[Aurora](./Aurora.md):** A specific [MeshSync](./MeshSync.md) device that uses [CR2032](./CR2032.md) batteries.
*   **[Gateway](./Gateway.md):** A central component in both [LoRaWAN](./LoRaWAN.md) and [MeshSync](./MeshSync.md) networks, with differing power implications.

## Related Concepts

*   **[LoRaWAN](./LoRaWAN.md):** A Low Power Wide Area Network (LPWAN) specification for wireless battery-operated 'things' in a regional, national or global network.
*   **[MeshSync](./MeshSync.md):** A mesh networking technology, compared against [LoRaWAN](./LoRaWAN.md) for power consumption.
*   **[Duty Cycle](./Duty%20Cycle.md):** The proportion of time that a system or component is active. In [LoRaWAN](./LoRaWAN.md), regulatory limits can impact transmission frequency and power.
*   **[CR2032](./CR2032.md):** A common coin cell lithium battery, used to power [MeshSync](./MeshSync.md) nodes.
*   **[Total Cost of Ownership](./Total%20Cost%20of%20Ownership.md) (TCO):** A financial estimate intended to help consumers and enterprise managers determine the direct and indirect costs of a product or system.

## Contradictions

*   **Contradiction:** Older research or assumptions suggested that mesh networks always consume less power than [LoRaWAN](./LoRaWAN.md). However, current findings indicate this is **false at 8+ nodes today**, implying that at higher node counts, mesh power consumption can exceed that of LoRaWAN under certain conditions.

## Sources

*   `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md`

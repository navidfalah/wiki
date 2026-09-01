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

This page synthesizes research on power consumption, primarily comparing LoRaWAN and MeshSync technologies for sensor networks. The analysis, conducted by Mira Chen, highlights key differences in power draw, particularly concerning node-level power sources, gateway requirements, and network-specific behaviors like duty cycle limits and rejoin events.

## Key Details

*   **Research Context:**
    *   **Author:** Mira Chen
    *   **Date:** 2026-07-06
    *   **Assumptions:** The comparison is based on a scenario involving 10 sensor nodes and one gateway, with a 15-minute sample interval.

*   **LoRaWAN (SenseNode-class):**
    *   **Duty Cycle:** EU regulations impose duty cycle limits, which can necessitate a longer effective sample interval or result in higher peak power consumption during transmission.
    *   **Gateway Power:** LoRaWAN systems typically require an always-on gateway, which consumes approximately 2W of wall power.

*   **MeshSync (Aurora):**
    *   **Node Power:** Each MeshSync node (e.g., Aurora) is powered by a CR2032 coin cell battery.
    *   **Rejoin Spikes:** Network rejoin events can cause significant power consumption spikes, especially at scale. While version 0.3.8 of the MeshSync software improved this issue, it has not been fully resolved.

*   **Comparative Conclusion (Draft):**
    *   A preliminary conclusion suggests that MeshSync offers advantages in Total Cost of Ownership (TCO) due to the absence of subscription fees and the elimination of a gateway wall wart (external power adapter).

## Related Entities

*   **Mira Chen:** Author of the comparative research.
*   **SenseNode:** A class of devices used in the LoRaWAN comparison.
*   **Aurora:** A specific MeshSync device that uses CR2032 batteries.
*   **Gateway:** A central component in both LoRaWAN and MeshSync networks, with differing power implications.

## Related Concepts

*   **LoRaWAN:** A Low Power Wide Area Network (LPWAN) specification for wireless battery-operated 'things' in a regional, national or global network.
*   **MeshSync:** A mesh networking technology, compared against LoRaWAN for power consumption.
*   **Duty Cycle:** The proportion of time that a system or component is active. In LoRaWAN, regulatory limits can impact transmission frequency and power.
*   **CR2032:** A common coin cell lithium battery, used to power MeshSync nodes.
*   **Total Cost of Ownership (TCO):** A financial estimate intended to help consumers and enterprise managers determine the direct and indirect costs of a product or system.

## Contradictions

*   **Contradiction:** Older research or assumptions suggested that mesh networks always consume less power than LoRaWAN. However, current findings indicate this is **false at 8+ nodes today**, implying that at higher node counts, mesh power consumption can exceed that of LoRaWAN under certain conditions.

## Sources

*   `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md`

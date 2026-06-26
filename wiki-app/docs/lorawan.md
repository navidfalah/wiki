---
id: lorawan
title: LoRaWAN
tags:
  - aurora
  - cr2032
  - duty-cycle-limits
  - gateway
  - lorawan
  - meshsync
  - mira-chen
  - rejoin-spikes
last_updated: "2026-06-25T07:34:13.345585+00:00"
sidebar_label: LoRaWAN
slug: /lorawan
---

# LoRaWAN

## Overview

LoRaWAN is a Low Power Wide Area Network (LPWAN) specification for wireless battery-operated "things" in a regional, national or global network. This page synthesizes research comparing LoRaWAN's [Power Consumption](./power-consumption.md) characteristics, particularly for [SenseNode-class](./sensenode-class.md) devices, against [MeshSync (Aurora)](./meshsync-aurora.md) in a specific deployment scenario. The research, conducted by [Mira Chen](./mira-chen.md) on 2026-07-06, focused on a setup with 10 sensor nodes, one [Gateway](./gateway.md), and a 15-minute sample interval.

## Key Details

*   **Power Consumption:**
    *   LoRaWAN gateways typically require always-on wall power, estimated at ~2W for the scenario studied.
    *   For SenseNode-class devices operating on LoRaWAN, [Duty Cycle Limits](./duty-cycle-limits.md) (e.g., in the EU) can necessitate longer effective intervals or higher peak power consumption to comply with regulations.
*   **Comparison Context:**
    *   The research assumed a deployment of 10 sensor nodes and a single gateway, with data sampled every 15 minutes.
    *   In a direct comparison, MeshSync (Aurora) nodes utilize CR2032 batteries per node.
*   **Total Cost of Ownership (TCO):**
    *   Preliminary conclusions suggest that MeshSync may offer advantages in [Total Cost of Ownership (TCO)](./total-cost-of-ownership-tco.md) due to the absence of subscription fees and the elimination of a gateway wall wart, which is typically required for LoRaWAN.

## Related Entities

*   **Mira Chen:** Author of the research comparing LoRaWAN and MeshSync power consumption.
*   **SenseNode-class:** A type of sensor node device considered in the power comparison for LoRaWAN.
*   **Gateway:** A central component in a LoRaWAN network, responsible for receiving data from nodes and forwarding it to a network server. Requires continuous power.
*   **MeshSync (Aurora):** A mesh networking technology used as a point of comparison for LoRaWAN, particularly regarding power efficiency.

## Related Concepts

*   **Duty Cycle Limits:** Regulatory restrictions on the proportion of time a radio transmitter can be active within a given period, impacting LoRaWAN device operation, especially in regions like the EU.
*   **Power Consumption:** A critical factor in IoT device design, especially for battery-powered nodes, influencing battery life and operational costs.
*   **Total Cost of Ownership (TCO):** A financial estimate intended to help consumers and enterprise managers determine the direct and indirect costs of a product or system.
*   **Rejoin Spikes:** A phenomenon observed in mesh networks (like MeshSync) where nodes consume significant power when [Rejoin Spikes](./rejoin-spikes.md) the network, especially at scale.

## Contradictions

*   **Contradiction:** Older research or bookmarks suggested that mesh networks always had lower power consumption. However, current findings from the 2026-07-06 research indicate this is **false at 8+ nodes today**, implying that LoRaWAN or other solutions might be more power-efficient in certain larger-scale mesh deployments.

## Sources

*   `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md`

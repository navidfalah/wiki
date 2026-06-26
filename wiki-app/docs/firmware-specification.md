---
id: firmware-specification
title: Firmware Specification
tags:
  - aurora-labs
  - nova-widget-v2
  - nrf52840
  - mesh-networking
  - firmware
  - battery-life
  - ota-updates
  - product-spec
last_updated: "2026-06-25T07:22:23.907416+00:00"
sidebar_label: Firmware Specification
slug: /firmware-specification
---

# Firmware Specification

## Overview

This document outlines the firmware requirements and operational characteristics for the Nova Widget v2, a second-generation soil/environment sensor developed by Aurora Labs. It details key aspects such as sensor reading intervals, mesh networking behavior, power consumption targets, and battery life expectations as defined in the product specification draft.

## Key Details

*   **Microcontroller (MCU):** The firmware operates on a Nordic nRF52840 microcontroller.
*   **Reading Interval:**
    *   **Default:** Every 15 minutes when the mesh network is active.
    *   **Configurable:** The interval can be adjusted via a companion application, ranging from 5 minutes to 24 hours.
    *   *Note:* Earlier kickoff discussions suggested an hourly default; this specification updates it to 15 minutes for beta feedback, necessitating a revalidation of battery life estimates.
*   **MeshSync Network:**
    *   Devices are designed to form a self-healing mesh network.
    *   The maximum hop count within the mesh is 4.
    *   A USB-powered gateway node is used to bridge the mesh network to MQTT.
    *   **Target Average Current:** The system aims for an average current consumption of less than 85 µA, which includes mesh overhead, in a 10-node deployment scenario.
*   **Battery Life Claims (influenced by firmware behavior):**
    *   **Marketing Target:** 24 months of operation at 15-minute intervals in a moderate mesh network (up to 5 nodes).
    *   **Internal Engineering Target:** A minimum of 18 months of operation in a 10-node deployment. This target is not intended for external publication.
*   **Over-the-Air (OTA) Updates:** The implementation of OTA update functionality is deferred to version 2.1 of the Nova Widget.

## Related Entities

*   **Aurora Labs:** The company developing the Nova Widget v2.
*   **Nova Widget v2:** The product for which this firmware specification applies.
*   **Nordic nRF52840:** The specific microcontroller unit (MCU) used.
*   **MQTT:** The messaging protocol used by the gateway node to bridge mesh data.
*   **Mira Chen:** Author of the Nova Widget v2 Product Spec (DRAFT).

## Related Concepts

*   Product Specification
*   Draft Status
*   Mesh Networking
*   Current Consumption
*   Battery Life
*   Over-the-Air (OTA) Updates
*   Bill of Materials (BOM)

## Contradictions

No direct contradictions were found within the provided source material. The note regarding the change in default reading interval from earlier discussions represents an evolution of the specification rather than a contradiction within the current draft.

## Sources

*   `articles/2026-05-15-product-spec-draft.md`

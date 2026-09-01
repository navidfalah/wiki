---
id: product-specification
title: Product Specification
tags:
  - aurora-labs
  - nova-widget-v2
  - soil-sensor
  - meshsync
  - nrf52840
  - cr2032
  - battery-life
  - product-specification
last_updated: "2026-06-25T07:51:59.799243+00:00"
sidebar_label: Product Specification
slug: /product-specification
---

# Product Specification

## Overview

The Nova Widget v2 is the second-generation soil/environment sensor developed by [Aurora Labs](./aurora-labs.md). This product specification outlines the details for the Aurora Nova Widget v2 beta unit, an open-source soil moisture and temperature sensor. It features a [MeshSync](./meshsync.md) local mesh network, designed to operate without mandatory cloud connectivity. This document is a draft, not for external distribution, and supersedes informal v1 notes where conflicts arise.

**Status:** DRAFT
**Owners:** Mira Chen (firmware), Jonah Park (hardware)

## Key Details

### Hardware

*   **MCU:** Nordic nRF52840
*   **Sensors:**
    *   Capacitive soil moisture
    *   SHT41 temperature/humidity
    *   VEML7700 light
*   **Battery:** CR2032 primary cell (x1)
*   **Antenna:** PCB trace, 2.4 GHz

### Firmware

*   **Reading Interval:**
    *   **Default:** Every 15 minutes when MeshSync is active.
    *   **Configurable:** 5 minutes to 24 hours via a companion app.
    *   *Note:* Kickoff notes initially mentioned an hourly default; this specification changes it to 15 minutes for beta feedback purposes. The battery life section requires revalidation due to this change.
*   **MeshSync:**
    *   Devices form a self-healing mesh network.
    *   **Max Hop Count:** 4
    *   **Gateway Node:** A USB-powered gateway node bridges the mesh to [MQTT](./mqtt.md).
    *   **Target Average Current:** &lt; 85 µA, including mesh overhead, in a 10-node deployment.
    *   **Max Theoretical Nodes:** 32
    *   **Beta Tested Nodes:** Up to 8 (unstable)
    *   **Parent Election:** Details pending (refer to whiteboard notes).
*   [**OTA Updates**](./ota-updates.md): Deferred to v2.1.

### Power Budget & Battery Life

*   **Battery:** CR2032 x 1
*   **Current Targets (DRAFT):**
    *   **Sleep Mode:** 4.2 µA (target)
    *   **Sample + TX:** 12 mA peak (at 15-minute interval)
    *   **Rejoin Spike:** 110–340 µA (KNOWN ISSUE)
*   **Battery Life Claims:**
    *   **Marketing Target:** 24 months at 15-minute intervals in a moderate mesh (≤ 5 nodes).
    *   **Internal Engineering Target:** 18 months minimum at 10 nodes (not for external publication).

### Enclosure

*   **Beta Units:** IP54 rated.
*   **General Availability (GA):** IP65 planned if gasket tooling budget allows (~$8k).

### Open Issues & Missing Sections

*   **Solar Trickle Charger:** Jonah Park proposes an optional module; Mira Chen expresses concern regarding the Bill of Materials (BOM) impact.
*   **Enclosure IP Rating:** Final rating pending.
*   **MQTT Export Schema:** Details are currently missing.

## Related Entities

*   **Aurora Labs:** The company developing the Nova Widget v2.
*   **Nova Widget v2:** The product itself, a second-generation soil/environment sensor.
*   **Mira Chen:** Firmware owner and author of the initial product spec draft.
*   **Jonah Park:** Hardware owner.
*   **Nordic nRF52840:** The Microcontroller Unit (MCU) used.
*   **SHT41:** Temperature and humidity sensor.
*   **VEML7700:** Light sensor.
*   **SenseNode SN-400**: A competitor product mentioned for comparison.
*   [**TeaBuddy**](./teabuddy.md): An unrelated product mentioned in kickoff notes.

## Related Concepts

*   **Capacitive Soil Moisture Sensor:** The primary sensing mechanism for soil moisture.
*   **MeshSync:** The proprietary self-healing mesh networking protocol used by the device.
*   **MQTT (Message Queuing Telemetry Transport):** Protocol used by the gateway node to bridge data.
*   **OTA (Over-The-Air) Updates:** Future capability for wireless firmware updates.
*   **BOM (Bill of Materials):** A list of components required to build the product.
*   **IP Rating (Ingress Protection):** Standard for defining levels of sealing effectiveness of electrical enclosures.
*   **CR2032:** A common type of lithium coin cell battery.

## Contradictions

No direct contradictions were found within the provided source material. Differences in battery life claims are explicitly stated as marketing targets versus internal engineering minimums. A change in the default reading interval from an earlier kickoff note to the current spec is noted as a revision rather than a contradiction.

## Sources

*   `articles/2026-05-15-product-spec-draft.md`
*   `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md`

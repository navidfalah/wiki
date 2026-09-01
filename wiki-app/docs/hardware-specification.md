---
id: hardware-specification
title: Hardware Specification
tags:
  - aurora-labs
  - average-current-target
  - battery-life-claim
  - bom-bill-of-materials
  - capacitive-soil-moisture-sensor
  - cr2032
  - draft-status
  - gasket-tooling-budget
last_updated: "2026-06-25T07:26:38.571608+00:00"
sidebar_label: Hardware Specification
slug: /hardware-specification
---

```markdown
# Hardware Specification

## Overview
This document outlines the hardware and firmware specifications for the **Nova Widget v2**, [Aurora Labs](./aurora-labs.md)' second-generation soil/environment sensor. Authored by Mira Chen, this is a draft specification, not intended for external distribution, and supersedes any conflicting informal notes from v1 development.

## Key Details

### Hardware Components
*   **Microcontroller (MCU):** Nordic nRF52840
*   **Sensors:**
    *   Capacitive Soil Moisture Sensor
    *   SHT41 temperature and humidity sensor
    *   VEML7700 light sensor
*   **Battery:** CR2032 primary cell
*   **Antenna:** PCB trace, operating at 2.4 GHz

### Firmware Specifications
*   **Reading Interval:**
    *   **Default:** Every 15 minutes when the mesh network is active.
    *   **Configurable:** Via a companion app, ranging from 5 minutes to 24 hours.
*   **MeshSync Network:**
    *   Devices form a self-healing mesh network.
    *   Maximum hop count: 4.
    *   A USB-powered gateway node bridges the mesh network to [MQTT](./mqtt.md).
    *   **Target Average Current:** Less than 85 µA, including mesh overhead, in a 10-node deployment.

### Battery Life Claims
*   **Marketing Target:** 24 months at 15-minute intervals in a moderate mesh (≤ 5 nodes).
*   **Internal Engineering Target:** Minimum of 18 months at 10 nodes (not for external publication).

### Enclosure
*   **Beta Units:** IP54 ingress protection rating.
*   **General Availability (GA):** IP65 rating is planned, contingent on a gasket tooling budget of approximately $8,000.

### Open Issues
*   **Solar Trickle Charger:** An optional module is desired by Jonah, but Mira Chen has concerns regarding the Bill of Materials (BOM) impact.
*   **[OTA Updates](./ota-updates.md):** Over-the-Air (OTA) update functionality is deferred to v2.1.

## Related Entities
*   **Aurora Labs:** The company developing the Nova Widget v2.
*   **Nova Widget v2:** The product being specified.
*   **Mira Chen:** Author of the product specification draft, concerned about BOM.
*   **Jonah:** Proposed an optional solar trickle charger module.

## Related Concepts
*   **Capacitive Soil Moisture Sensor:** A type of sensor used in the Nova Widget v2.
*   **CR2032:** A common type of lithium coin cell battery used in the device.
*   **[Mesh Networking](./mesh-networking.md):** The self-healing network architecture used by Nova Widget v2 devices (MeshSync).
*   **MQTT:** The protocol used by the gateway node to bridge mesh data.
*   **IP Rating (Ingress Protection):** Standards for enclosure protection against solids and liquids (IP54, IP65).
*   **Bill of Materials (BOM):** A list of components required to build a product, a concern for optional modules.
*   **[Over-the-Air Updates](./ota-updates.md):** A method for wirelessly updating device firmware.
*   **Average Current Target:** A key power consumption metric for battery-powered devices.

## Contradictions
*   **Reading Interval Default:** The current draft specifies a default reading interval of 15 minutes, which supersedes earlier kickoff notes that mentioned an hourly default. This change requires revalidation of battery life estimates.
*   **Battery Life Targets:** There is a distinction between the marketing target (24 months at ≤ 5 nodes) and the more conservative internal engineering target (18 months minimum at 10 nodes). The internal target is not to be published externally.

## Sources
*   `articles/2026-05-15-product-spec-draft.md`
```

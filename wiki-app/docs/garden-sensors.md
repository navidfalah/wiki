---
id: garden-sensors
title: Garden Sensors
tags:
  - garden-sensors
  - ip67
  - ip54
  - lorawan
  - meshsync
  - cloud-lock-in
  - cr2032
  - hardware-habit
last_updated: "2026-06-25T07:23:59.869817+00:00"
sidebar_label: Garden Sensors
slug: /garden-sensors
---

```markdown
# Garden Sensors

## Overview

Garden sensors are devices designed to monitor various environmental conditions relevant to plant health and growth in outdoor or indoor garden settings. This page details two specific models: the SenseNode SN-400 and the Aurora Nova Widget v2, comparing their features, performance, and design philosophies.

## Key Details

### SenseNode SN-400

The SenseNode SN-400 is a commercially available garden sensor known for its robust build and [LoRaWAN](./lorawan.md) connectivity.

*   **Price:** $49
*   **Enclosure:** Features an excellent IP67-rated enclosure, providing superior weather sealing.
*   **Module:** Utilizes an STM32WL module.
*   **Connectivity:** Employs [LoRaWAN](./lorawan.md) for communication, which is not a mesh network. This avoids mesh complexity but may incur [LoRaWAN](./lorawan.md) network fees.
*   **Battery Life:**
    *   Claimed: 3 years.
    *   Estimated (Alex Rivera): Approximately 22 months at the default 30-minute reading interval.
*   **Cloud Integration:** Requires a cloud dashboard for alerts, with a limited free tier, indicating a degree of Cloud Lock-in.

### Aurora Nova Widget v2

The Aurora Nova Widget v2 is a pre-release beta unit from [Aurora Labs](./aurora-labs.md), notable for its open approach and mesh networking capabilities.

*   **Status:** Beta unit, not yet commercially available.
*   **Enclosure:** Features an IP54-rated plastic enclosure, offering moderate weather sealing, visibly less robust than the [SenseNode](./sensenode.md).
*   **Module:** Built around an nRF52840 chip.
*   **Connectivity:** Uses a custom [MeshSync](./meshsync.md) mesh network (likely BLE-based), which eliminates [LoRaWAN](./lorawan.md) fees and offers mesh flexibility.
*   **Battery:** Powered by a CR2032 coin cell battery.
*   **Battery Life:**
    *   Claimed: 2 years at 15-minute reading intervals.
    *   Estimated (Alex Rivera): Approximately 20 months, based on an average power consumption of ~92 µA with a 3-node mesh (slightly above [Aurora Labs](./aurora-labs.md)'s 85 µA target).
*   **Cloud Integration:** Offers open [MQTT](./mqtt.md) export, requiring no account, which signifies no Cloud Lock-in.

### Comparison Summary

| Feature           | SenseNode SN-400    | Aurora Nova Widget v2 |
| :---------------- | :------------------ | :-------------------- |
| Weather Sealing   | Excellent (IP67)    | Moderate (IP54)       |
| Connectivity      | [LoRaWAN](./lorawan.md)             | BLE + [MeshSync](./meshsync.md)        |
| Cloud Lock-in     | Yes                 | No                    |
| Estimated Battery | ~22 months          | ~20 months            |

For serious outdoor deployments, the SenseNode SN-400 offers superior enclosure protection. However, the Aurora Nova Widget v2 excels in openness and mesh network flexibility, avoiding gateway subscription fees.

## Related Entities

*   **Alex Rivera:** Author of the "Hardware Habit" blog post.
*   **[Aurora Labs](./aurora-labs.md):** Developer of the Nova Widget v2.
*   **Hardware Habit:** Blog that published the teardown.
*   **[SenseNode](./sensenode.md):** Manufacturer of the SN-400 garden sensor.
*   **SenseNode SN-400:** Specific garden sensor model.
*   **Nova Widget v2:** Specific garden sensor model (beta).

## Related Concepts

*   **Cloud Lock-in:** A situation where a user is dependent on a single cloud provider and cannot easily switch to another.
*   **CR2032:** A common type of lithium coin cell battery.
*   **IP54:** An Ingress Protection rating indicating protection against dust ingress and splashing water.
*   **IP67:** An Ingress Protection rating indicating full protection against dust ingress and immersion in water up to 1 meter for 30 minutes.
*   **[LoRaWAN](./lorawan.md):** A Low Power Wide Area Network (LPWAN) specification for wireless battery-operated "things" in a regional, national or global network.
*   **[MeshSync](./meshsync.md):** A custom mesh networking protocol used by [Aurora Labs](./aurora-labs.md).
*   **[MQTT](./mqtt.md):** Message Queuing Telemetry Transport, a lightweight messaging protocol for small sensors and mobile devices.
*   **nRF52840:** A powerful, highly flexible ultra-low power multiprotocol SoC from Nordic Semiconductor, often used for Bluetooth Low Energy (BLE) and mesh applications.
*   **STM32WL:** A wireless microcontroller from STMicroelectronics, integrating a [LoRaWAN](./lorawan.md) radio.

## Contradictions

*   **Battery Type for Nova Widget v2:** An earlier report incorrectly stated that the Aurora Nova Widget v2 used a CR2450 battery. This was later corrected; the beta unit actually uses a **CR2032** battery.

## Sources

*   `articles/2026-05-20-competitor-teardown-blog.md`
```

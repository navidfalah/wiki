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

Garden sensors are devices designed to monitor various environmental conditions relevant to plant health and growth in outdoor or indoor garden settings. This page details two specific models: the [SenseNode SN-400](./sensenode-sn-400.md) and the [Aurora Nova Widget v2](./aurora-nova-widget-v2.md), comparing their features, performance, and design philosophies.

## Key Details

### SenseNode SN-400

The [SenseNode SN-400](./sensenode-sn-400.md) is a commercially available garden sensor known for its robust build and [LoRaWAN](./lorawan.md) connectivity.

*   **Price:** $49
*   **Enclosure:** Features an excellent [IP67](./ip67.md)-rated enclosure, providing superior weather sealing.
*   **Module:** Utilizes an [STM32WL](./stm32wl.md) module.
*   **Connectivity:** Employs [LoRaWAN](./lorawan.md) for communication, which is not a mesh network. This avoids mesh complexity but may incur [LoRaWAN](./lorawan.md) network fees.
*   **Battery Life:**
    *   Claimed: 3 years.
    *   Estimated ([Alex Rivera](./alex-rivera.md)): Approximately 22 months at the default 30-minute reading interval.
*   **Cloud Integration:** Requires a cloud dashboard for alerts, with a limited free tier, indicating a degree of [Cloud Lock-in](./cloud-lock-in.md).

### Aurora Nova Widget v2

The [Aurora Nova Widget v2](./aurora-nova-widget-v2.md) is a pre-release beta unit from [Aurora Labs](./aurora-labs.md), notable for its open approach and mesh networking capabilities.

*   **Status:** Beta unit, not yet commercially available.
*   **Enclosure:** Features an [IP54](./ip54.md)-rated plastic enclosure, offering moderate weather sealing, visibly less robust than the [SenseNode](./sensenode.md).
*   **Module:** Built around an [nRF52840](./nrf52840.md) chip.
*   **Connectivity:** Uses a custom [MeshSync](./meshsync.md) mesh network (likely BLE-based), which eliminates [LoRaWAN](./lorawan.md) fees and offers mesh flexibility.
*   **Battery:** Powered by a [CR2032](./cr2032.md) coin cell battery.
*   **Battery Life:**
    *   Claimed: 2 years at 15-minute reading intervals.
    *   Estimated ([Alex Rivera](./alex-rivera.md)): Approximately 20 months, based on an average power consumption of ~92 µA with a 3-node mesh (slightly above [Aurora Labs](./aurora-labs.md)'s 85 µA target).
*   **Cloud Integration:** Offers open [MQTT](./mqtt.md) export, requiring no account, which signifies no [Cloud Lock-in](./cloud-lock-in.md).

### Comparison Summary

| Feature           | SenseNode SN-400    | Aurora Nova Widget v2 |
| :---------------- | :------------------ | :-------------------- |
| Weather Sealing   | Excellent ([IP67](./ip67.md))    | Moderate ([IP54](./ip54.md))       |
| Connectivity      | [LoRaWAN](./lorawan.md)             | BLE + [MeshSync](./meshsync.md)        |
| [Cloud Lock-in](./cloud-lock-in.md)     | Yes                 | No                    |
| Estimated Battery | ~22 months          | ~20 months            |

For serious outdoor deployments, the [SenseNode SN-400](./sensenode-sn-400.md) offers superior enclosure protection. However, the [Aurora Nova Widget v2](./aurora-nova-widget-v2.md) excels in openness and mesh network flexibility, avoiding gateway subscription fees.

## Related Entities

*   **[Alex Rivera](./alex-rivera.md):** Author of the "[Hardware Habit](./hardware-habit.md)" blog post.
*   **[Aurora Labs](./aurora-labs.md):** Developer of the Nova Widget v2.
*   **[Hardware Habit](./hardware-habit.md):** Blog that published the teardown.
*   **[SenseNode](./sensenode.md):** Manufacturer of the SN-400 garden sensor.
*   **[SenseNode SN-400](./sensenode-sn-400.md):** Specific garden sensor model.
*   **Nova Widget v2:** Specific garden sensor model (beta).

## Related Concepts

*   **[Cloud Lock-in](./cloud-lock-in.md):** A situation where a user is dependent on a single cloud provider and cannot easily switch to another.
*   **[CR2032](./cr2032.md):** A common type of lithium coin cell battery.
*   **[IP54](./ip54.md):** An Ingress Protection rating indicating protection against dust ingress and splashing water.
*   **[IP67](./ip67.md):** An Ingress Protection rating indicating full protection against dust ingress and immersion in water up to 1 meter for 30 minutes.
*   **[LoRaWAN](./lorawan.md):** A Low Power Wide Area Network (LPWAN) specification for wireless battery-operated "things" in a regional, national or global network.
*   **[MeshSync](./meshsync.md):** A custom mesh networking protocol used by [Aurora Labs](./aurora-labs.md).
*   **[MQTT](./mqtt.md):** Message Queuing Telemetry Transport, a lightweight messaging protocol for small sensors and mobile devices.
*   **[nRF52840](./nrf52840.md):** A powerful, highly flexible ultra-low power multiprotocol SoC from Nordic Semiconductor, often used for Bluetooth Low Energy (BLE) and mesh applications.
*   **[STM32WL](./stm32wl.md):** A wireless microcontroller from STMicroelectronics, integrating a [LoRaWAN](./lorawan.md) radio.

## Contradictions

*   **Battery Type for Nova Widget v2:** An earlier report incorrectly stated that the [Aurora Nova Widget v2](./aurora-nova-widget-v2.md) used a [CR2450](./cr2450.md) battery. This was later corrected; the beta unit actually uses a **[CR2032](./cr2032.md)** battery.

## Sources

*   `articles/2026-05-20-competitor-teardown-blog.md`
```

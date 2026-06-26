---
id: wireless-connectivity
title: Wireless Connectivity
tags:
  - lorawan
  - meshsync
  - ble
  - cloud-lock-in
  - ip67
  - ip54
  - battery-life
  - sensor-connectivity
last_updated: "2026-06-25T08:06:42.637698+00:00"
sidebar_label: Wireless Connectivity
slug: /wireless-connectivity
---

# Wireless Connectivity

## Overview

Wireless connectivity is a critical aspect of modern IoT devices, particularly for sensors deployed in various environments. Different wireless technologies offer distinct advantages and disadvantages concerning range, power consumption, network architecture, and associated costs. This page explores two prominent approaches: LoRaWAN and a custom Bluetooth Low Energy (BLE) mesh solution, as observed in a teardown of garden sensors.

## Key Details

### LoRaWAN Connectivity

*   **Technology**: LoRaWAN is a low-power, wide-area networking protocol designed for battery-operated devices in regional, national, or global networks. It is not a mesh network.
*   **Implementation Example**: The SenseNode SN-400 sensor utilizes an STM32WL module for LoRaWAN connectivity.
*   **Characteristics**:
    *   **Network Fees**: LoRaWAN deployments can incur fees, often associated with gateway subscriptions or network service providers.
    *   **Cloud Dependency**: Devices often require a cloud dashboard for full functionality, such as alerts, which may come with limitations on free tiers.
    *   **Battery Life**: The SenseNode SN-400, using LoRaWAN, has an estimated battery life of approximately 22 months at a default 30-minute reading interval.
    *   **Environmental Suitability**: The SenseNode SN-400 features an excellent IP67 weather-sealed enclosure, making it suitable for serious outdoor deployments.

### MeshSync (BLE Mesh) Connectivity

*   **Technology**: MeshSync is a custom mesh networking solution built upon Bluetooth Low Energy (BLE). BLE mesh networks allow devices to relay messages to each other, extending the range and reliability of the network.
*   **Implementation Example**: The Aurora Nova Widget v2 (beta unit) employs an nRF52840 chip combined with its proprietary MeshSync mesh technology.
*   **Characteristics**:
    *   **Network Fees**: This approach avoids LoRaWAN-specific fees, offering a potentially more cost-effective solution for network operation.
    *   **Openness**: The Nova Widget v2 provides open MQTT export, eliminating the need for a proprietary account or cloud lock-in.
    *   **Power Consumption**: The Nova Widget v2, powered by a CR2032 battery, showed an average power consumption of approximately 92 µA with a 3-node mesh, slightly above Aurora Labs' target of 85 µA.
    *   **Battery Life**: Aurora Labs claims 2 years at 15-minute readings, though independent estimates suggest around 20 months.
    *   **Environmental Suitability**: The Nova Widget v2 has a moderate IP54 plastic enclosure, indicating less robust weather sealing compared to IP67.

### Connectivity Implications

*   **Cloud Lock-in**: Some wireless solutions, like the SenseNode SN-400's LoRaWAN implementation, can lead to cloud lock-in, requiring specific dashboards or accounts for full functionality. Others, like Aurora's MeshSync with open MQTT, offer greater flexibility.
*   **Battery Life**: The choice of wireless technology significantly impacts device battery life, with estimates varying based on reading intervals and network activity.
*   **Environmental Factors**: The robustness of a device's enclosure (e.g., IP67 vs. IP54) is crucial for outdoor wireless deployments, protecting the internal components and ensuring reliable connectivity.

## Related Entities

*   **SenseNode SN-400**: A garden sensor utilizing LoRaWAN connectivity.
*   **Aurora Nova Widget v2**: A beta garden sensor featuring custom MeshSync (BLE mesh) connectivity.
*   **Hardware Habit**: A blog that published a teardown comparing these sensors.
*   **Alex Rivera**: Author of the "Competitor Teardown" blog post.
*   **Aurora Labs**: The company developing the Nova Widget v2.

## Related Concepts

*   **LoRaWAN**: A low-power, wide-area network protocol.
*   **MeshSync**: A custom mesh networking technology based on BLE.
*   **Bluetooth Low Energy (BLE)**: A wireless personal area network technology designed for low power consumption.
*   **STM32WL**: A system-on-chip (SoC) module often used for LoRaWAN applications.
*   **nRF52840**: A powerful, highly flexible ultra-low power multiprotocol SoC, commonly used for BLE and other wireless applications.
*   **Cloud Lock-in**: A situation where a customer is dependent on a single cloud provider and cannot easily switch to another vendor.
*   **IP67**: An Ingress Protection rating indicating dust-tightness and protection against immersion in water up to 1 meter for 30 minutes.
*   **IP54**: An Ingress Protection rating indicating protection against dust ingress (not dust-tight) and splashing water from any direction.
*   **CR2032**: A common coin cell lithium battery.
*   **CR2450**: A larger coin cell lithium battery.

## Contradictions

*   **Battery Type**: An earlier version of the "Competitor Teardown" blog post incorrectly stated that the Aurora Nova Widget v2 used a CR2450 battery. This was later corrected; the beta unit actually uses a **CR2032** battery.

## Sources

*   `articles/2026-05-20-competitor-teardown-blog.md`

---
id: wireless-communication
title: Wireless Communication
tags:
  - mesh-networking
  - lorawan
  - bluetooth-low-energy
  - battery-life
  - duty-cycle
  - iot-sensors
  - local-first
  - aurora-labs
last_updated: "2026-06-25T08:06:30.406195+00:00"
sidebar_label: Wireless Communication
slug: /wireless-communication
---

# Wireless Communication

## Overview

Wireless communication is a fundamental aspect of modern Internet of Things (IoT) devices, enabling data exchange without physical cables. This page explores various wireless protocols and their applications, particularly in [sensor networks](./sensor-networks.md), focusing on [Mesh Networking](./mesh-networking.md) (e.g., [MeshSync](./meshsync.md)), [LoRaWAN](./lorawan.md), and Bluetooth Low Energy (BLE). Key considerations include [power consumption](./power-consumption.md), [battery life](./battery-life.md), duty cycles, and network architecture (e.g., local-first vs. cloud-dependent).

## Key Details

### MeshSync (Aurora Labs)

*   **Application**: Utilized by the [Nova Widget](./nova-widget.md) beta, a local mesh soil sensor developed by [Aurora Labs](./aurora-labs.md) (Mira Chen).
*   **Architecture**: Designed with a LAN-first approach, offering optional [MQTT](./mqtt.md) integration without mandatory cloud services. Mesh data is intended to stay on the local network.
*   **Power**: Nodes are powered by CR2032 batteries, with a target of 15-minute read intervals. It aims for a lower duty cycle compared to Wi-Fi.
*   **Scalability**: While effective for garden-scale deployments with multiple sensors, "rejoin spikes" can impact performance and [power consumption](./power-consumption.md) at larger scales, though improvements were noted in version 0.3.8.
*   **Cost**: Often cited as winning on Total Cost of Ownership (TCO) due to the absence of subscriptions and no requirement for a gateway wall wart (unlike [LoRaWAN](./lorawan.md)).
*   **Hardware**: Research into nRF52840 sleep modes suggests its use or consideration for [MeshSync](./meshsync.md) devices.
*   **Durability**: [Nova Widget](./nova-widget.md) is rated IP54, suitable for general use but not for submersion.

### LoRaWAN

*   **Application**: Exemplified by "[SenseNode](./sensenode.md)-class" devices, often used in wide-area [sensor networks](./sensor-networks.md).
*   **Power**: Gateways typically require always-on wall power (~2W). Nodes are subject to duty cycle limits, particularly in regions like the EU, which can necessitate longer effective intervals or higher peak power.
*   **Cost**: Often associated with subscription models, contributing to "subscription fatigue" among users.
*   **Durability**: [SenseNode](./sensenode.md) devices are known for an IP67 rating, making them suitable for submersion use cases.

### Bluetooth Low Energy (BLE)

*   **Application**: Ideal for single-device scenarios, such as kitchen gadgets.
*   **Comparison**: While effective for close-range, one-to-one connections, [mesh networking](./mesh-networking.md) is generally preferred for garden-scale deployments involving multiple sensors.

### General Wireless Communication Concepts

*   **Duty Cycle**: A critical factor in [power consumption](./power-consumption.md), especially for [battery-powered devices](./battery-life.md). Different protocols have varying duty cycle limitations and implications.
*   **Battery Life**: A major concern for IoT devices. CR2032 batteries are commonly used, and "[battery math](./battery-life.md)" and discharge curves are important research areas.
*   **Local-first Architecture**: An approach where data processing and storage prioritize local networks over mandatory cloud services, enhancing privacy and reducing reliance on external infrastructure.
*   **Power Comparison**: The [power efficiency](./power-consumption.md) of different protocols (e.g., [mesh](./mesh-networking.md) vs. [LoRaWAN](./lorawan.md)) is a frequent topic of research and comparison, especially concerning total cost and operational complexity.

## Related Entities

*   **[Aurora Labs](./aurora-labs.md)**: Developer of [MeshSync](./meshsync.md) and the [Nova Widget](./nova-widget.md).
*   **Mira Chen**: Co-founder of [Aurora Labs](./aurora-labs.md).
*   **[TeaBuddy](./teabuddy.md)**: A product/company (Alex Kim) that also uses CR2032 batteries and emphasizes local-first principles.
*   **[SenseNode](./sensenode.md)**: A class of [LoRaWAN](./lorawan.md)-based sensor devices.
*   **nRF52840**: A common microcontroller often used in BLE and [mesh networking](./mesh-networking.md) applications, known for its sleep modes.

## Related Concepts

*   [Mesh Networking](./mesh-networking.md)
*   [LoRaWAN](./lorawan.md)
*   Bluetooth Low Energy (BLE)
*   Duty Cycle
*   [Battery Life](./battery-life.md)
*   [Power Consumption](./power-consumption.md)
*   Local-first Architecture
*   Internet of Things (IoT)
*   [Sensor Networks](./sensor-networks.md)
*   IP Ratings (Ingress Protection)
*   CR2032 Battery Discharge Curve

## Contradictions

*   **Mesh Power Consumption**:
    **Contradiction:** Early research suggested [mesh networking](./mesh-networking.md) always had lower [power consumption](./power-consumption.md), but current findings indicate this is false at 8 or more nodes, where [LoRaWAN](./lorawan.md) may become more power-efficient.
*   **Battery Life Claims**:
    **Contradiction:** There is a discrepancy between marketing claims (e.g., 2 years) and engineering estimates (e.g., 18 months) regarding the [battery life](./battery-life.md) of CR2032-powered devices like those from [TeaBuddy](./teabuddy.md) and [Aurora Labs](./aurora-labs.md). This highlights a general tension between marketing and engineering [battery claims](./battery-life.md).

## Sources

*   `notes/2026-06-10-fragmented-research.txt`
*   `samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt`
*   `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md`
*   `samples/transcripts/[SAMPLE]-2026-07-11-podcast-outline-unrecorded.txt`

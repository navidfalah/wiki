---
id: product-comparison
title: Product Comparison
tags:
  - alex-rivera
  - amazon
  - aurora-labs
  - aurora-nova-widget
  - aurora-nova-widget-v2-beta
  - battlecard
  - cheapoco
  - sensenode-sn-400
  - garden-sensors
  - iot-sensors
  - competitive-analysis
last_updated: "2026-06-25T07:47:56.849066+00:00"
sidebar_label: Product Comparison
slug: /product-comparison
---

```markdown
# Product Comparison

## Overview

This page provides a comparative analysis of various smart sensor products, primarily focusing on [Garden Sensors](./garden-sensors.md) like the **[Aurora Nova Widget v2](./aurora-nova-widget-v2.md)** (beta) and the **[SenseNode SN-400](./sensenode-sn-400.md)**. It also includes brief details on other adjacent products such as the [CheapoCo SoilStick](./cheapoco-soilstick.md) and [TeaBuddy Puck](./teabuddy-puck.md). The comparison highlights key features such as weather sealing, connectivity, cloud integration, and battery performance.

## Key Details

### Aurora Nova Widget v2 (beta)

*   **Status**: Beta unit, not yet commercially available.
*   **Enclosure & Weather Sealing**: [IP54](./ip54.md) plastic, offering moderate sealing. This is visibly less sealed than the [SenseNode SN-400](./sensenode-sn-400.md). There is a roadmap for [IP65](./ip65.md).
*   **Connectivity**: Utilizes an [nRF52840](./nrf52840.md) module with a custom **[MeshSync](./meshsync.md)** mesh protocol ([BLE](./ble.md) + MeshSync).
    *   **Advantages**: Avoids [LoRaWAN](./lorawan.md) fees and cloud subscriptions, offering mesh flexibility. Features an open [MQTT](./mqtt.md) export, requiring no account.
    *   **Disadvantages**: Can exhibit complexity at scale, with a known issue of a "rejoin spike" when adding an 8th node, causing the mesh to stop reporting. A fix is anticipated in 0.3.8 firmware. It is recommended to stay at 6 nodes until the patch is released.
*   **Battery**: Uses a [CR2032](./cr2032.md) cell. [Aurora Labs](./aurora-labs.md) claims 2 years of battery life at 15-minute readings. Independent testing by [Alex Rivera](./alex-rivera.md) estimated approximately 20 months, with an average power consumption of ~92 µA (slightly above the 85 µA target) in a 3-node mesh.
*   **Cloud Integration**: Optional cloud integration; no account is required for data export.
*   **Target Use**: Garden/soil sensing.

### SenseNode SN-400

*   **Price**: $49.
*   **Enclosure & Weather Sealing**: Features a solid [IP67](./ip67.md) enclosure, providing excellent sealing and superior weather resistance compared to the [Aurora Nova Widget v2](./aurora-nova-widget-v2.md).
*   **Connectivity**: Uses an [STM32WL](./stm32wl.md) module with **[LoRaWAN](./lorawan.md)** protocol (not mesh).
    *   **Advantages**: Offers a simpler topology and can handle up to 10 devices without issues, as reported by users.
*   **Battery**: Claims a 3-year battery life. Independent testing by [Alex Rivera](./alex-rivera.md) estimated approximately 22 months at a default 30-minute interval. The device uses a [CR2450](./cr2450.md) battery.
*   **Cloud Integration**: Requires a cloud dashboard for alerts, with a limited free tier. Emphasizes subscription costs over a 3-year period.
*   **Target Use**: Serious outdoor deployment, [Garden Sensors](./garden-sensors.md).

### CheapoCo SoilStick

*   **Connectivity**: [WiFi](./wifi.md).
*   **Cloud Integration**: Requires cloud access.
*   **Weather Sealing**: None.
*   **Battery**: USB powered.
*   **Target Use**: [Garden Sensors](./garden-sensors.md).

### TeaBuddy Puck

*   **Product Type**: Kitchen/lifestyle adjacent product, specifically a local-only tea timer.
*   **Connectivity**: [BLE](./ble.md).
*   **Cloud Integration**: Local-only.
*   **Weather Sealing**: Splash-resistant, suitable for kitchen use.
*   **Relationship**: Not considered a direct competitor; rather, it's a potential partnership or co-marketing opportunity.

### TimerCap

*   **Product Type**: Mechanical timer, not a smart device.
*   **Status**: [TimerCap](./timercap.md) Kickstarter campaign failed in 2024.

## Related Entities

*   **[Aurora Labs](./aurora-labs.md)**: Developer of the Nova Widget.
*   **[SenseNode](./sensenode.md)**: Manufacturer of the [SenseNode SN-400](./sensenode-sn-400.md) sensor.
*   **[CheapoCo](./cheapoco.md)**: Manufacturer of the [CheapoCo SoilStick](./cheapoco-soilstick.md).
*   **[TeaBuddy](./teabuddy.md)**: Manufacturer of the [TeaBuddy Puck](./teabuddy-puck.md) tea timer.
*   **[Alex Rivera](./alex-rivera.md)**: Author of the "Teardown: [SenseNode SN-400](./sensenode-sn-400.md) vs the indie sensor crowd" blog post.
*   **[Jonah Park](./jonah-park.md)**: Author of the "Competitive landscape Q3 2026 — Aurora internal" report and internal notes on support tickets.

## Related Concepts

*   **[IP67](./ip67.md) / [IP54](./ip54.md) / [IP65](./ip65.md)**: Ingress Protection ratings indicating levels of dust and water resistance.
*   **[LoRaWAN](./lorawan.md)**: A Low Power Wide Area Network (LPWAN) specification for wireless battery-operated "things" in a regional, national or global network.
*   **[MeshSync](./meshsync.md)**: A custom mesh networking protocol used by [Aurora Labs](./aurora-labs.md), leveraging [BLE](./ble.md).
*   **[Cloud Lock-in](./cloud-lock-in.md)**: Dependence on a specific vendor's cloud services, often involving subscription fees.
*   **[Battlecard](./battlecard.md)**: A competitive analysis tool used internally to highlight strengths and weaknesses against competitors.
*   **[Garden Sensors](./garden-sensors.md)**: Devices designed to monitor environmental conditions relevant to gardening, such as soil moisture, temperature, and light.

## Contradictions

*   **Aurora Nova Widget Battery Type**:
    *   **Contradiction:** An internal Amazon draft and an earlier version of [Alex Rivera](./alex-rivera.md)'s blog post incorrectly stated the [Aurora Nova Widget v2](./aurora-nova-widget-v2.md) used a [CR2450](./cr2450.md) battery.
    *   **Resolution:** The beta unit of the [Aurora Nova Widget v2](./aurora-nova-widget-v2.md) uses a **[CR2032](./cr2032.md)** battery. This was corrected in [Alex Rivera](./alex-rivera.md)'s blog post and is reflected in [Aurora Labs](./aurora-labs.md)'s internal competitive landscape document. The Amazon draft requires correction before publication.

## Sources

*   `articles/2026-05-20-competitor-teardown-blog.md`
*   `samples/articles/[SAMPLE]-2026-07-09-competitive-landscape-q3.md`
*   `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt`
*   `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt`
*   `transcripts/TEST-support-ticket.txt`
```

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

This page provides a comparative analysis of various smart sensor products, primarily focusing on [Garden Sensors](./garden-sensors.md) like the **Aurora Nova Widget v2** (beta) and the **SenseNode SN-400**. It also includes brief details on other adjacent products such as the CheapoCo SoilStick and TeaBuddy Puck. The comparison highlights key features such as weather sealing, connectivity, cloud integration, and battery performance.

## Key Details

### Aurora Nova Widget v2 (beta)

*   **Status**: Beta unit, not yet commercially available.
*   **Enclosure & Weather Sealing**: IP54 plastic, offering moderate sealing. This is visibly less sealed than the SenseNode SN-400. There is a roadmap for IP65.
*   **Connectivity**: Utilizes an nRF52840 module with a custom **[MeshSync](./meshsync.md)** mesh protocol (BLE + MeshSync).
    *   **Advantages**: Avoids [LoRaWAN](./lorawan.md) fees and cloud subscriptions, offering mesh flexibility. Features an open [MQTT](./mqtt.md) export, requiring no account.
    *   **Disadvantages**: Can exhibit complexity at scale, with a known issue of a "rejoin spike" when adding an 8th node, causing the mesh to stop reporting. A fix is anticipated in 0.3.8 firmware. It is recommended to stay at 6 nodes until the patch is released.
*   **Battery**: Uses a CR2032 cell. [Aurora Labs](./aurora-labs.md) claims 2 years of battery life at 15-minute readings. Independent testing by Alex Rivera estimated approximately 20 months, with an average power consumption of ~92 µA (slightly above the 85 µA target) in a 3-node mesh.
*   **Cloud Integration**: Optional cloud integration; no account is required for data export.
*   **Target Use**: Garden/soil sensing.

### SenseNode SN-400

*   **Price**: $49.
*   **Enclosure & Weather Sealing**: Features a solid IP67 enclosure, providing excellent sealing and superior weather resistance compared to the Aurora Nova Widget v2.
*   **Connectivity**: Uses an STM32WL module with **[LoRaWAN](./lorawan.md)** protocol (not mesh).
    *   **Advantages**: Offers a simpler topology and can handle up to 10 devices without issues, as reported by users.
*   **Battery**: Claims a 3-year battery life. Independent testing by Alex Rivera estimated approximately 22 months at a default 30-minute interval. The device uses a CR2450 battery.
*   **Cloud Integration**: Requires a cloud dashboard for alerts, with a limited free tier. Emphasizes subscription costs over a 3-year period.
*   **Target Use**: Serious outdoor deployment, [Garden Sensors](./garden-sensors.md).

### CheapoCo SoilStick

*   **Connectivity**: WiFi.
*   **Cloud Integration**: Requires cloud access.
*   **Weather Sealing**: None.
*   **Battery**: USB powered.
*   **Target Use**: [Garden Sensors](./garden-sensors.md).

### TeaBuddy Puck

*   **Product Type**: Kitchen/lifestyle adjacent product, specifically a local-only tea timer.
*   **Connectivity**: BLE.
*   **Cloud Integration**: Local-only.
*   **Weather Sealing**: Splash-resistant, suitable for kitchen use.
*   **Relationship**: Not considered a direct competitor; rather, it's a potential partnership or co-marketing opportunity.

### TimerCap

*   **Product Type**: Mechanical timer, not a smart device.
*   **Status**: TimerCap Kickstarter campaign failed in 2024.

## Related Entities

*   **[Aurora Labs](./aurora-labs.md)**: Developer of the Nova Widget.
*   **[SenseNode](./sensenode.md)**: Manufacturer of the SenseNode SN-400 sensor.
*   **CheapoCo**: Manufacturer of the CheapoCo SoilStick.
*   **[TeaBuddy](./teabuddy.md)**: Manufacturer of the TeaBuddy Puck tea timer.
*   **Alex Rivera**: Author of the "Teardown: SenseNode SN-400 vs the indie sensor crowd" blog post.
*   **Jonah Park**: Author of the "Competitive landscape Q3 2026 — Aurora internal" report and internal notes on support tickets.

## Related Concepts

*   **IP67 / IP54 / IP65**: Ingress Protection ratings indicating levels of dust and water resistance.
*   **[LoRaWAN](./lorawan.md)**: A Low Power Wide Area Network (LPWAN) specification for wireless battery-operated "things" in a regional, national or global network.
*   **[MeshSync](./meshsync.md)**: A custom mesh networking protocol used by [Aurora Labs](./aurora-labs.md), leveraging BLE.
*   **Cloud Lock-in**: Dependence on a specific vendor's cloud services, often involving subscription fees.
*   **Battlecard**: A competitive analysis tool used internally to highlight strengths and weaknesses against competitors.
*   **[Garden Sensors](./garden-sensors.md)**: Devices designed to monitor environmental conditions relevant to gardening, such as soil moisture, temperature, and light.

## Contradictions

*   **Aurora Nova Widget Battery Type**:
    *   **Contradiction:** An internal Amazon draft and an earlier version of Alex Rivera's blog post incorrectly stated the Aurora Nova Widget v2 used a CR2450 battery.
    *   **Resolution:** The beta unit of the Aurora Nova Widget v2 uses a **CR2032** battery. This was corrected in Alex Rivera's blog post and is reflected in [Aurora Labs](./aurora-labs.md)'s internal competitive landscape document. The Amazon draft requires correction before publication.

## Sources

*   `articles/2026-05-20-competitor-teardown-blog.md`
*   `samples/articles/[SAMPLE]-2026-07-09-competitive-landscape-q3.md`
*   `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt`
*   `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt`
*   `transcripts/TEST-support-ticket.txt`
```

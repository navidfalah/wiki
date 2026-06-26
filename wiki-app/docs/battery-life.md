---
id: battery-life
title: Battery Life
tags:
  - battery life
  - aurora labs
  - nova widget v2
  - sensenode sn-400
  - cr2032
  - average current
  - meshsync
  - product specifications
last_updated: "2026-06-25T07:12:46.525729+00:00"
sidebar_label: Battery Life
slug: /battery-life
---

# Battery Life

## Overview
Battery life is a critical performance metric for wireless sensor devices, directly impacting user experience and maintenance requirements. This page details the battery life claims, targets, and independent estimates for the [Nova Widget v2](./Nova%20Widget%20v2.md) and its competitor, the [SenseNode SN-400](./SenseNode%20SN-400.md). Key factors influencing battery life include the battery type, sensor [Reading Interval](./Reading%20Interval.md)s, network activity (e.g., mesh overhead), and [Average Current Target](./Average%20Current%20Target.md) consumption.

## Key Details

### Aurora Nova Widget v2
The [Nova Widget v2](./Nova%20Widget%20v2.md) is designed to operate on a **[CR2032](./CR2032.md) primary cell battery**.
*   **Battery Type:** [CR2032](./CR2032.md) primary cell. An initial report by [Alex Rivera](./Alex%20Rivera.md) mistakenly identified the battery as a [CR2450](./CR2450.md), but this was later corrected to [CR2032](./CR2032.md), which aligns with the product specification.
*   **Reading Interval:** The default sensor [Reading Interval](./Reading%20Interval.md) is every 15 minutes when the [MeshSync](./Mesh%20Sync.md) mesh network is active. This interval is configurable via a companion application, allowing settings from 5 minutes to 24 hours. The default was updated from an earlier hourly setting to 15 minutes for beta feedback.
*   **Average Current Target:** The internal engineering target for [Average Current Target](./Average%20Current%20Target.md) consumption is less than 85 µA. This target includes [MeshSync](./Mesh%20Sync.md) overhead in a 10-node deployment scenario.
*   **Battery Life Claims & Estimates:**
    *   **Marketing Target:** [Aurora Labs](./Aurora%20Labs.md) aims for a marketing claim of 24 months of battery life when operating at 15-minute intervals in a moderate mesh deployment (up to 5 nodes).
    *   **Internal Engineering Target:** The internal engineering team targets a minimum of 18 months of battery life in a 10-node mesh deployment. This target is not intended for external publication.
    *   **Independent Estimate ([Alex Rivera](./Alex%20Rivera.md)):** Independent power profiling conducted by [Alex Rivera](./Alex%20Rivera.md) over a 48-hour sample observed an average current of approximately 92 µA with a 3-node [MeshSync](./Mesh%20Sync.md) mesh. Based on this observation, the estimated battery life for the [Nova Widget v2](./Nova%20Widget%20v2.md) is around 20 months.

### SenseNode SN-400
The [SenseNode SN-400](./SenseNode%20SN-400.md) is a competitor garden sensor that utilizes LoRaWAN for connectivity.
*   **Claimed Battery Life:** The manufacturer claims a 3-year battery life for the device.
*   **Independent Estimate ([Alex Rivera](./Alex%20Rivera.md)):** [Alex Rivera](./Alex%20Rivera.md)'s independent estimate for the [SenseNode SN-400](./SenseNode%20SN-400.md)'s battery life is approximately 22 months, based on its default 30-minute [Reading Interval](./Reading%20Interval.md).

## Related Entities
*   **[Aurora Labs](./Aurora%20Labs.md):** The company developing the [Nova Widget v2](./Nova%20Widget%20v2.md).
*   **[Nova Widget v2](./Nova%20Widget%20v2.md):** [Aurora Labs](./Aurora%20Labs.md)' second-generation soil/environment sensor.
*   **[SenseNode SN-400](./SenseNode%20SN-400.md):** A competing garden sensor product.
*   **[Alex Rivera](./Alex%20Rivera.md):** Author of the Hardware Habit blog, known for independent teardowns and power profiling of sensor devices.
*   **[Mira Chen](./Mira%20Chen.md):** Author of the [Nova Widget v2](./Nova%20Widget%20v2.md) product specification draft.

## Related Concepts
*   **[CR2032](./CR2032.md):** A common type of lithium coin cell battery used in the [Nova Widget v2](./Nova%20Widget%20v2.md).
*   **[CR2450](./CR2450.md):** A larger lithium coin cell battery type, initially (and incorrectly) reported as the battery for the [Nova Widget v2](./Nova%20Widget%20v2.md).
*   **[MeshSync](./Mesh%20Sync.md):** [Aurora Labs](./Aurora%20Labs.md)' proprietary self-healing mesh networking protocol, which contributes to the device's power consumption.
*   **[Average Current Target](./Average%20Current%20Target.md):** A design specification for the average electrical current drawn by a device, directly influencing its battery longevity.
*   **[Reading Interval](./Reading%20Interval.md):** The configurable frequency at which the sensor takes and transmits measurements, a primary factor in overall power usage.
*   **[Bill of Materials](./Bill%20of%20Materials.md) (BOM):** The comprehensive list of components required to build a product, which can be impacted by design choices like battery type.

## Contradictions
*   **[Nova Widget v2](./Nova%20Widget%20v2.md) [Average Current Target](./Average%20Current%20Target.md) Consumption:** The internal engineering target for average current is less than 85 µA for a 10-node deployment. However, independent testing by [Alex Rivera](./Alex%20Rivera.md) observed an average current of approximately 92 µA in a smaller 3-node mesh. This suggests that the actual current consumption might be higher than the target, potentially impacting real-world battery life.
*   **[Nova Widget v2](./Nova%20Widget%20v2.md) Battery Life Estimates:** The marketing target for the [Nova Widget v2](./Nova%20Widget%20v2.md) is 24 months (at ≤ 5 nodes), while [Alex Rivera](./Alex%20Rivera.md)'s independent estimate is ~20 months (at 3 nodes). The internal engineering target is 18 months minimum (at 10 nodes). While these figures are based on different node counts and conditions, Alex's estimate is lower than the marketing target even with fewer nodes, indicating a potential discrepancy or a more conservative real-world performance compared to marketing claims.
*   **[SenseNode SN-400](./SenseNode%20SN-400.md) Battery Life:** The manufacturer claims a 3-year (36 months) battery life for the [SenseNode SN-400](./SenseNode%20SN-400.md). However, [Alex Rivera](./Alex%20Rivera.md)'s independent estimate is significantly lower at approximately 22 months, representing a substantial difference between the claimed and estimated performance.

## Sources
*   `articles/2026-05-15-product-spec-draft.md`
*   `articles/2026-05-20-competitor-teardown-blog.md`
*   `samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt`

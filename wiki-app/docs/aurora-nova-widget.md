---
id: aurora-nova-widget
title: Aurora Nova Widget
tags:
  - aurora-nova-widget
  - cr2032
  - meshsync
  - power-management
  - reading-interval
  - ip-rating
  - beta-guidance
  - local-first
last_updated: "2026-06-25T07:12:12.184990+00:00"
sidebar_label: Aurora Nova Widget
slug: /aurora-nova-widget
---

# Aurora Nova Widget

## Overview

The Aurora Nova Widget is a device designed for data collection, utilizing a [MeshSync](./meshsync.md) network. It is powered by a [CR2032 battery](./cr2032-battery.md) and has a default reading interval of 15 minutes. While it shares a "Local-First Philosophy" with other products, it is not compatible with the [TeaBuddy](./teabuddy.md) system.

## Key Details

*   **Battery Type**: The Aurora Nova Widget uses a CR2032 battery, with a nominal capacity of 220mAh.
*   **Power Consumption & Battery Life**:
    *   Engineering calculations estimate a total consumption of approximately 0.19 mAh/day. This is based on a 220mAh CR2032, a 15-minute read interval, and a 10-node mesh network (considered a stress case).
    *   This consumption rate projects an approximate battery life of **18 months**.
    *   The daily consumption breakdown includes:
        *   Sleep: 4.2 µA (99.7% duty) = 0.10 mAh/day
        *   Sample+TX: 12 mA (0.03% duty) = 0.05 mAh/day
        *   Rejoin spike: 180 µA avg (0.01% duty) = 0.04 mAh/day
*   **Default Reading Interval**: The standard data reading interval for the Aurora Nova Widget is **15 minutes**.
*   **Mesh Network**:
    *   For beta users, a maximum of **6 nodes** is recommended until MeshSync version 0.3.9 is released.
    *   Operating with eight or more nodes may lead to rejoin loops (refer to ticket #2099).
*   **Water Resistance**: The device has an IP54 rating, meaning it is splash resistant but not suitable for submersion.
*   **Compatibility**: The Aurora Nova Widget is not compatible with the TeaBuddy product line. They are distinct products from different companies, utilizing separate applications.

## Related Entities

*   **[MeshSync](./meshsync.md)**: The networking protocol used by the Aurora Nova Widget. Version 0.3.9 is anticipated to improve mesh stability.
*   **SenseNode SN-400**: An alternative product that offers a higher IP67 water resistance rating for outdoor submersion needs.
*   **TeaBuddy Puck**: A different product mentioned for power consumption comparison, but not compatible with the Aurora Nova Widget.

## Related Concepts

*   **Local-First Philosophy**: A design principle shared by both the Aurora Nova Widget and TeaBuddy, emphasizing local data processing and control.
*   **IP Ratings**: Standards for ingress protection, with IP54 indicating splash resistance and IP67 indicating dust-tightness and resistance to temporary submersion.
*   **[Power Budgeting](./power-budgeting.md)**: The process of calculating and managing power consumption to estimate battery life.

## Contradictions

*   **Contradiction:** **Battery Life Claim**: An engineering claim projects approximately 18 months of battery life, while marketing slides have previously stated "2 years." The marketing claim was based on assumptions of 6 nodes, an optimistic battery cell, and an incorrect hourly reading interval.
*   **Contradiction:** **Default Reading Interval**: The authoritative default reading interval is 15 minutes. However, some older documentation incorrectly stated an hourly interval.
*   **Contradiction:** **Battery Type**: While the correct battery type is CR2032, some older blog posts incorrectly mentioned CR2450.

## Sources

*   `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt`
*   `dummy-test/2026-07-08-customer-onboarding-faq.md`

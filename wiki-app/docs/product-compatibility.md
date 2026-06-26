---
id: product-compatibility
title: Product Compatibility
tags:
  - aurora-nova-widget
  - beta-recommendation
  - default-reading-interval
  - ip54
  - ip67
  - local-first
  - meshsync
  - product-compatibility
last_updated: "2026-06-25T07:48:09.023580+00:00"
sidebar_label: Product Compatibility
slug: /product-compatibility
---

```markdown
# Product Compatibility

## Overview

This page details various compatibility aspects and technical specifications for products, primarily focusing on the [Aurora Nova Widget](./aurora-nova-widget.md), including sensor capacity, environmental resistance, power requirements, and interoperability with other systems.

## Key Details

*   **Aurora Nova Widget Sensor Capacity**
    *   The [Beta testing](./beta-testing.md) recommendation for the Aurora Nova Widget is to connect a maximum of **6 nodes**.
    *   Connecting eight or more nodes may lead to rejoin loops, an issue tracked under ticket #2099.
    *   This limitation is expected to be addressed with [MeshSync](./meshsync.md) version 0.3.9.

*   **Default Reading Interval**
    *   The standard data reading interval for the Aurora Nova Widget is **15 minutes**.

*   **Water Resistance ([IP Rating](./ip-rating.md))**
    *   The Aurora Nova Widget has an **IP54** rating, meaning it is splash resistant but **not submersible**.
    *   For applications requiring outdoor submersion, the [SenseNode SN-400](./sensenode-sn-400.md) offers an **IP67** rating.

*   **Battery Type**
    *   The Aurora Nova Widget uses a **CR2032** battery.

*   **Compatibility with TeaBuddy**
    *   The Aurora Nova Widget is **not compatible** with [TeaBuddy](./teabuddy.md).
    *   These are distinct products from different companies, requiring separate applications.
    *   Both products, however, share a "[Local-first architecture](./local-first-architecture.md)" philosophical approach to data handling.

## Related Entities

*   Aurora Nova Widget
*   SenseNode SN-400
*   MeshSync
*   TeaBuddy

## Related Concepts

*   IP Rating (IP54, IP67)
*   Local-first architecture
*   [Sensor networks](./sensor-networks.md)
*   Beta testing

## Contradictions

*   **Reading Interval:** Some older documentation incorrectly stated an hourly reading interval; this was a mistake from the product kickoff. The correct default interval is 15 minutes.
*   **Battery Type:** Certain blog posts inaccurately mentioned CR2450 as the battery type. The correct battery type is CR2032.

## Sources

*   `dummy-test/2026-07-08-customer-onboarding-faq.md`
```

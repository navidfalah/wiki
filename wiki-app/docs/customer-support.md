---
id: customer-support
title: Customer Support
tags:
  - customer support
  - aurora nova widget
  - teabuddy
  - product specifications
  - battery
  - waterproofing
  - app compatibility
  - firmware updates
last_updated: "2026-06-25T07:18:22.250314+00:00"
sidebar_label: Customer Support
slug: /customer-support
---

```markdown
# Customer Support

## Overview

Customer Support addresses inquiries and issues related to product specifications, functionality, and compatibility for products like the [Aurora Nova Widget](./aurora-nova-widget.md) and [TeaBuddy](./teabuddy.md). Common support topics include [Battery Specifications](./battery-specifications.md), waterproofing, app integration, and known software issues.

## Key Details

### Aurora Nova Widget

*   **Battery Specification**:
    *   The correct battery type for the Aurora Nova Widget is CR2032.
    *   An earlier blog post by "Alex" incorrectly listed CR2450, but this has since been corrected (as of 2026-06-20), and the official wiki page has been updated.
    *   Battery Life Factors estimates vary: marketing materials state 2 years, while forum discussions suggest 18 months. The actual battery life depends on factors such as node count and the read interval (defaulting to 15 minutes). A detailed power budget document is expected to be published soon.
*   **Waterproofing**:
    *   The Aurora Nova Widget has an IP54 rating, meaning it is protected from dust and splashing water, but it is not fully waterproof.
    *   It is not comparable to devices with an IP67 rating, such as the [SenseNode](./sensenode.md), which can withstand immersion.
    *   Customers are advised to use a cover for units installed in outdoor environments prone to rain.
    *   The decision for IP54 was a Cost/Tooling Tradeoffs, with a beta focus on local mesh and open export features. An upgrade to IP65 is on the roadmap.
    *   A comparison page detailing waterproofing differences is scheduled for update in Sprint 15.
*   **Known Issues & Fixes**:
    *   **Rejoin Loop**: For ticket #2099, a known issue with rejoin loops can be resolved by [updating to version 0.3.8](./firmware-updates.md) and maintaining a maximum of six nodes.

### TeaBuddy

*   **App Compatibility**:
    *   The TeaBuddy puck uses a separate BLE kitchen app and does not share an app with the Aurora Nova Widget (which uses the [MeshSync](./meshsync.md) garden app).
    *   TeaBuddy is a different Product Differentiation from a different company.
*   **Waterproofing**:
    *   The TeaBuddy puck is splash-resistant, designed for kitchen use, but is not fully waterproof.
*   **Known Issues & Fixes**:
    *   **iOS 18 Pairing**: Pairing issues with iOS 18 have been fixed in version 0.9.3.
    *   **TB-142 Cancel Bug**: A long-press reset can resolve the TB-142 cancel bug.

## Related Entities

*   **Aurora Nova Widget**: A product for which customer support is provided, often used in garden settings.
*   **TeaBuddy**: A separate kitchen-focused product with its own app and specifications.
*   **SenseNode (SN-400)**: A competitor product, often referenced for its IP67 waterproofing.
*   **Alex**: Author of a blog that initially contained an incorrect battery specification for the Aurora Nova Widget.

## Related Concepts

*   **[Battery Specifications](./battery-specifications.md)**: CR2032, CR2450.
*   **Battery Life Factors**: Node count, read interval, power budget.
*   **IP Ratings**: Industry standards for ingress protection (e.g., IP54, IP65, IP67).
*   **App Compatibility**: Differentiation between [MeshSync](./meshsync.md) garden app and BLE kitchen app.
*   **Product Differentiation**: Understanding the distinct features and limitations of different products (e.g., [Aurora Nova Widget](./aurora-nova-widget.md) vs. [TeaBuddy](./teabuddy.md)).
*   **Cost/Tooling Tradeoffs**: Business decisions influencing product specifications and features.
*   **[Firmware Updates](./firmware-updates.md)**: Solutions for known software issues (e.g., versions 0.3.8, 0.9.3).

## Contradictions

*   **Battery Type**:
    > **Contradiction:** Alex's teardown blog initially listed CR2450 as the battery type for the Aurora Nova Widget, while the official specification stated CR2032. This contradiction has been resolved; CR2032 is correct, and the blog and wiki have been updated.
*   **Battery Life Expectancy**:
    > **Contradiction:** Marketing materials for the Aurora Nova Widget claim a 2-year battery life, whereas forum discussions suggest 18 months. This discrepancy is explained by varying usage patterns, specifically node count and read interval, which significantly impact power consumption.

## Sources

*   `samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt`
*   `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt`
*   `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt`
```

---
id: product-troubleshooting
title: Product Troubleshooting
tags:
  - alex
  - aurora
  - ble-kitchen-app
  - cr2032
  - cr2450
  - cross-ticket
  - ios-18
  - ip54
last_updated: "2026-06-25T07:53:23.201516+00:00"
sidebar_label: Product Troubleshooting
slug: /product-troubleshooting
---

# Product Troubleshooting

## Overview
This page compiles common troubleshooting scenarios and solutions for various products, including [Nova Widget](./nova-widget.md) and TeaBuddy pucks, addressing issues related to app compatibility, firmware, waterproofing, pairing, and component specifications.

## Key Details

*   **Product Ecosystems and [App Compatibility](./app-compatibility.md)**
    *   **Nova Widget**: Utilizes the [MeshSync](./meshsync-app.md) garden application.
    *   **[TeaBuddy Puck](./teabuddy-puck.md)**: Operates with a BLE kitchen application.
    *   These products belong to different company ecosystems and use separate applications, even if owned by the same customer (a "cross-ticket" scenario).

*   **Waterproofing ([IP Ratings](./ip-ratings-explained.md))**
    *   Our products typically have an **IP54** rating.
    *   Competitor products, such as [SenseNode](./sensenode.md), may feature a higher **IP67** waterproof rating.
    *   **Recommendation**: For environments requiring greater water resistance, recommend a protective cover and provide a link to a comparison page detailing IP ratings.

*   **Nova Widget Specific Issues**
    *   **Rejoin Loop (Ticket #2099)**: This is a known issue.
        *   **Solution**: Update the device firmware to version **0.3.8**.
        *   **Limitation**: Ensure the system operates with a maximum of six nodes to prevent recurrence.

*   **TeaBuddy Specific Issues**
    *   **Pairing with [iOS 18](./ios-18-compatibility.md)**: This issue has been resolved.
        *   **Solution**: Ensure the TeaBuddy firmware is updated to version **0.9.3**.
    *   **TB-142 Cancel Bug**:
        *   **Solution**: Perform a long-press reset on the TeaBuddy device.

*   **Battery Specifications**
    *   **Correct Battery Type**: Our products, including those mentioned in [Alex](./alex-profile.md)'s blog, use [CR2032](./cr2032-battery.md) batteries.
    *   **Typo Correction**: A blog post by Alex previously contained a typo incorrectly stating [CR2450](./cr2450-battery.md). This has been corrected in the wiki and Alex's blog.

## Related Entities
*   [Nova Widget](./nova-widget.md)
*   [TeaBuddy Puck](./teabuddy-puck.md)
*   [SenseNode](./sensenode.md)
*   [Alex](./alex-profile.md) (blogger/content creator)
*   [MeshSync](./meshsync-app.md) (app)
*   [BLE Kitchen App](./ble-kitchen-app.md)
*   [iOS 18](./ios-18-compatibility.md)

## Related Concepts
*   [Firmware Updates](./firmware-updates.md)
*   [IP Ratings](./ip-ratings-explained.md) (IP54, IP67)
*   Battery Types ([CR2032](./cr2032-battery.md), [CR2450](./cr2450-battery.md))
*   [App Compatibility](./app-compatibility.md)
*   [Device Pairing](./device-pairing.md)
*   [Known Issues/Bugs](./known-issues-bugs.md)
*   [Cross-ticket Support](./cross-ticket-support.md)

## Contradictions
No explicit contradictions were found in the provided source material.

## Sources
*   `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt`

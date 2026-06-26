---
id: training
title: Training
tags:
  - alex
  - aurora
  - ble-kitchen-app
  - cr2032
  - cr2450
  - cross-ticket
  - ios-18
  - ip54
last_updated: "2026-06-25T08:04:40.927019+00:00"
sidebar_label: Training
slug: /training
---

```markdown
# Training

## Overview

This page synthesizes information from a support training roleplay scenario, focusing on common customer issues and their resolutions related to various products like [Nova Widget](./nova-widget.md) and [TeaBuddy](./teabuddy.md). The training covers topics ranging from app compatibility and waterproofing to software bugs and hardware specifications.

## Key Details

*   **Customer Scenario**: A common customer scenario involves owning both a Nova Widget and a TeaBuddy puck, often requesting a single application for both.
*   **Application Differences**:
    *   Nova Widget utilizes the [MeshSync Garden App](./meshsync-garden-app.md).
    *   TeaBuddy puck uses a separate [BLE Kitchen App](./ble-kitchen-app.md). These are from different companies and require distinct applications.
*   **Waterproofing Comparison**:
    *   [SenseNode](./sensenode.md) products are noted for IP67 waterproofing.
    *   "Our" products (implied to be Nova Widget/TeaBuddy) have an IP54 rating.
    *   For IP54 rated devices, it is recommended to use a cover, and a comparison page should be linked for customer reference.
*   **Ticket #2099 Rejoin Loop**:
    *   This is a known issue.
    *   Resolution involves updating the device software to version 0.3.8.
    *   Users should maintain a maximum of six nodes to prevent this issue.
*   **TeaBuddy Pairing with iOS 18**:
    *   This [Pairing](./pairing.md) issue was fixed in TeaBuddy software version 0.9.3.
    *   For the [TB-142](./tb-142.md) model, a long-press reset is required to resolve a specific cancel bug.
*   **Battery Type Clarification**:
    *   The correct battery type used is CR2032.
    *   A blog post by "[Alex](./alex.md)" and the internal wiki previously contained a typo incorrectly stating CR2450, which has since been corrected.

## Related Entities

*   **Nova Widget**: A product mentioned in a [Cross-Ticket](./cross-ticket.md) scenario.
*   **TeaBuddy Puck**: Another product mentioned, often alongside Nova Widget, with specific pairing and battery details.
*   **SenseNode**: A product line referenced for its higher IP67 waterproofing rating.
*   **Alex**: An individual responsible for a blog that required a correction regarding [Battery Types](./battery-types.mdd).
*   **Aurora**: Implied customer or product context in the training scenario.
*   **TB-142**: A specific model of TeaBuddy that requires a long-press reset for a cancel bug.

## Related Concepts

*   **MeshSync Garden App**: The application used by Nova Widget.
*   **BLE Kitchen App**: The application used by TeaBuddy puck.
*   **[IP Ratings](./ip-ratings.md) (IP67, IP54)**: Standards for ingress protection, indicating waterproofing and dust resistance.
*   **Cross-Ticket**: A support scenario involving multiple products from potentially different companies.
*   **Rejoin Loop**: A software bug where a device repeatedly attempts to reconnect.
*   **Pairing**: The process of connecting two devices wirelessly (e.g., TeaBuddy with iOS).
*   **Battery Types (CR2032, CR2450)**: Specific coin cell battery standards.

## Contradictions

*   **Contradiction:** An external blog post by Alex and an internal wiki incorrectly stated the battery type as CR2450. The correct battery type for the device in question is CR2032. This has been corrected in both sources.

## Sources

*   `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt`
```

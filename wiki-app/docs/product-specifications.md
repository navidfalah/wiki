---
id: product-specifications
title: Product Specifications
tags:
  - alex
  - aurora-labs
  - aurora-nova-widget
  - beta-recommendation
  - beta-tester-defaults
  - cloud-fee
  - cr2032-battery
  - cr2450-battery
last_updated: "2026-06-25T07:52:14.108986+00:00"
sidebar_label: Product Specifications
slug: /product-specifications
---

# Product Specifications

## Overview

This page details the key specifications for the [Aurora Nova Widget](./aurora-nova-widget.md), a [Local-first](./local-first.md) device developed by [Aurora Labs](./aurora-labs.md). It covers technical details such as sensor capacity, water resistance, battery type, and compatibility, along with known issues and comparisons to related products like the [SenseNode SN-400](./sensenode-sn-400.md).

## Key Details

*   **Sensor Capacity:**
    *   [MeshSync](./meshsync.md) is currently stable at 8 nodes.
    *   The beta recommendation was to limit to 6 nodes until MeshSync 0.3.9, as eight or more nodes could cause rejoin loops (see ticket #2099).
*   **Default Reading Interval:**
    *   The current default reading interval for the Aurora Nova Widget is 15 minutes.
    *   **Contradiction:** Some older documentation and initial kickoff discussions incorrectly stated an hourly interval.
*   **Water Resistance (IP Rating):**
    *   The Aurora Nova Widget has an [IP54](./ip54.md) rating, making it splash resistant but not suitable for submersion.
    *   For applications requiring outdoor submersion, the SenseNode SN-400 offers an [IP67](./ip67.md) rating.
    *   Achieving an IP65 rating for the Nova Widget would require an $8,000 tooling investment.
*   **Battery Type:**
    *   The Aurora Nova Widget uses a [CR2032](./cr2032.md) battery.
    *   **Contradiction:** Some blog posts and [Alex](./alex.md)'s teardown incorrectly mentioned [CR2450](./cr2450.md).
*   **Cloud Fee:**
    *   MeshSync operates without a cloud fee.
*   **Compatibility:**
    *   The Aurora Nova Widget is not compatible with [TeaBuddy](./teabuddy.md). These are distinct products from different companies, utilizing separate applications, despite both adhering to a "local-first" philosophy.
*   **Known Issues:**
    *   A power spike of 110 µA has been observed when a node rejoins the MeshSync network.

## Related Entities

*   **Aurora Labs:** The company developing the Aurora Nova Widget.
*   **SenseNode SN-400:** An alternative product offering IP67 water resistance for outdoor submersion.
*   **TeaBuddy:** An unrelated product with which the Aurora Nova Widget is not compatible.
*   **Alex:** An individual whose teardown incorrectly identified the battery type.

## Related Concepts

*   **MeshSync:** The underlying technology for node communication, stable at 8 nodes.
*   **IP54:** The water resistance rating for the Aurora Nova Widget (splash resistant).
*   **IP67:** The water resistance rating for the SenseNode SN-400 (submersible).
*   **CR2032:** The correct battery type used in the Aurora Nova Widget.
*   **CR2450:** An incorrectly cited battery type for the Aurora Nova Widget.
*   **Local-first:** A philosophical approach to product design, shared by Aurora Nova Widget and TeaBuddy.

## Contradictions

*   **Reading Interval:** The default reading interval is 15 minutes, but older documentation and initial kickoff discussions incorrectly stated an hourly interval.
*   **Battery Type:** The correct battery type is CR2032, but some blog posts and Alex's teardown incorrectly identified it as CR2450.

## Sources

*   `dummy-test/2026-07-08-customer-onboarding-faq.md`
*   `transcripts/2026-05-28-weekly-sync.md`
*   `transcripts/TEST-support-ticket.txt`

---
id: customer-support-faq
title: Customer Support FAQ
tags:
  - aurora-nova-widget
  - beta-recommendation
  - customer-support-faq
  - default-reading-interval
  - ip54
  - ip67
  - local-first
  - meshsync
last_updated: "2026-06-25T07:17:55.115261+00:00"
sidebar_label: Customer Support FAQ
slug: /customer-support-faq
---

# Customer Support FAQ

## Overview

This FAQ addresses common questions regarding the [Aurora Nova Widget](./aurora-nova-widget.md), particularly during its beta phase. It covers topics ranging from sensor limits and reading intervals to waterproofing and compatibility with other products.

## Key Details

*   **Sensor Capacity**
    *   During the beta phase, it is recommended to add a maximum of **6 nodes** (sensors) to the [Aurora Nova Widget](./aurora-nova-widget.md).
    *   Adding eight or more nodes may lead to rejoin loops, an issue tracked under ticket #2099, which is expected to be resolved with [MeshSync](./meshsync.md) 0.3.9.

*   **Default Reading Interval**
    *   The standard reading interval for the [Aurora Nova Widget](./aurora-nova-widget.md) is **15 minutes**.
    *   Some older documentation incorrectly stated an hourly interval, which was a mistake from the product kickoff.

*   **Water Resistance**
    *   The [Aurora Nova Widget](./aurora-nova-widget.md) has an **[IP54 rating](./ip54-rating.md)**, meaning it is splash resistant but not suitable for submersion.
    *   For applications requiring outdoor submersion, the [SenseNode SN-400](./sensenode-sn-400.md) offers an **[IP67 rating](./ip67-rating.md)**.

*   **Battery Type**
    *   The [Aurora Nova Widget](./aurora-nova-widget.md) uses a **[CR2032](./cr2032-battery.md)** battery.
    *   Earlier blog posts mistakenly mentioned [CR2450](./cr2450-battery.md) batteries, which has since been corrected in the wiki.

*   **Compatibility with TeaBuddy**
    *   The [Aurora Nova Widget](./aurora-nova-widget.md) is **not compatible** with [TeaBuddy](./teabuddy.md).
    *   These are distinct products from different companies, each with their own dedicated applications.
    *   However, both products share a "[Local-first architecture](./local-first-architecture.md)" philosophical approach to data handling.

## Related Entities

*   [Aurora Nova Widget](./aurora-nova-widget.md)
*   [SenseNode SN-400](./sensenode-sn-400.md)
*   [TeaBuddy](./teabuddy.md)

## Related Concepts

*   [MeshSync](./meshsync.md) (specifically version 0.3.9)
*   [IP54 rating](./ip54-rating.md)
*   [IP67 rating](./ip67-rating.md)
*   [Local-first architecture](./local-first-architecture.md)

## Contradictions

*   **Contradiction:** Older documentation incorrectly stated the default reading interval as hourly; the correct interval is 15 minutes.
*   **Contradiction:** Some blog posts incorrectly identified the battery type as [CR2450](./cr2450-battery.md); the correct battery type is [CR2032](./cr2032-battery.md).

## Sources

*   `dummy-test/2026-07-08-customer-onboarding-faq.md`

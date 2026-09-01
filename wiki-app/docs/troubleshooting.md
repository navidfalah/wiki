---
id: troubleshooting
title: Troubleshooting
tags:
  - alex
  - nova-widget
  - sensenode
  - teabuddy
  - troubleshooting
  - wiki
last_updated: "2026-09-01T19:21:50.439424+00:00"
sidebar_label: Troubleshooting
slug: /troubleshooting
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Troubleshooting

## Overview
This wiki page covers support and troubleshooting guidelines for various [hardware](./hardware.md) and software products, including [Nova Widget](./nova-widget.md), [TeaBuddy](./teabuddy.md), and related ecosystem items. It outlines common customer issues, distinguishing between different company products, app requirements, and known [firmware bugs](./firmware-bugs.md).

## Key Details
- **Multi-Product Ownership:** Customers occasionally own both Nova Widget and TeaBuddy pucks while expecting a single application. Support must clarify that these are different companies using separate applications.
  - *Nova Widget* utilizes the MeshSync garden app.
  - *TeaBuddy* utilizes the [BLE](./ble.md) kitchen app.
- **[Waterproofing](./waterproofing.md) Comparisons:** When customers cite [SenseNode SN-400](./sensenode-sn-400.md)'s waterproof rating (IP67), support should clarify that our devices are rated IP54. It is recommended to suggest a cover and link the comparison page.
- **Ticket #2099 (Rejoin Loop):** This is a known issue. The resolution is to update to firmware version 0.3.8 and maintain a limit of six nodes.
- **TeaBuddy iOS 18 Pairing:** Pairing issues on iOS 18 were resolved in version 0.9.3. For the TB-142 cancel bug, a long-press reset is required.
- **CR2450 Blog Typo:** Regarding confusion over battery types mentioned in a blog post, our devices use the CR2032 battery. The wiki has been corrected, and Alex's blog has been updated accordingly.

## Related Entities
- Nova Widget
- TeaBuddy
- SenseNode
- Alex

## Related Concepts
- MeshSync garden app
- BLE kitchen app
- [Firmware updates](./firmware-updates.md)
- IP ratings (IP54 vs IP67)
- [Battery specifications](./battery-specifications.md) (CR2032 vs CR2450)

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt` | text | Unverified |

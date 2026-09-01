---
id: product-training
title: Product Training
tags:
  - alex
  - nova-widget
  - product-training
  - sensenode
  - teabuddy
  - wiki
last_updated: "2026-09-01T21:25:07.549098+00:00"
sidebar_label: Product Training
slug: /product-training
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Training

## Overview
This page documents support training roleplay scenarios and key [troubleshooting](./troubleshooting.md) guidelines covering multiple product lines, including [Nova Widget](./nova-widget.md), [TeaBuddy](./teabuddy.md), and third-party interactions such as [SenseNode SN-400](./sensenode-sn-400.md). It addresses cross-ticket handling, app ecosystems, [firmware](./firmware.md) fixes, and [documentation](./documentation.md) updates.

## Key Details
- **Multi-Product Ownership & Apps:** When a customer owns multiple products from different companies (such as Nova Widget and a [TeaBuddy](./teabuddy.md) puck) within a single app request, support must direct them to the appropriate ecosystem. Nova uses the [MeshSync](./meshsync.md) garden app, whereas TeaBuddy uses a [BLE](./ble.md) kitchen app.
- **[Waterproofing](./waterproofing.md) Comparison (SenseNode):** 
  - SenseNode features an IP67 waterproof rating.
  - Our products feature an IP54 rating.
  - Support should recommend using a protective cover and link the comparison page when customers compare devices against SenseNode.
- **Ticket #2099 (Rejoin Loop):**
  - Identified as a known issue.
  - Resolution: Update firmware to version `0.3.8`.
  - Operational constraint: Users must stay at a maximum of six nodes.
- **TeaBuddy Pairing (iOS 18):**
  - Pairing issues on iOS 18 were resolved in firmware version `0.9.3`.
  - For the TB-142 cancel bug, users must perform a long-press reset.
- **Documentation & Blog Corrections:**
  - A customer-facing blog typo incorrectly referenced the CR2450 battery.
  - Verified that our [hardware](./hardware.md) uses the CR2032 battery. 
  - Both the internal wiki and Alex's blog have been updated to reflect the correction.

## Related Entities
- **Nova Widget**
- **TeaBuddy (including model TB-142)**
- **SenseNode**
- **MeshSync Garden App**
- **Alex**

## Related Concepts
- **[Firmware Updates](./firmware-updates.md):** Managing version upgrades (e.g., `0.3.8` for loop fixes, `0.9.3` for iOS 18 pairing).
- **Waterproof Ratings:** IP54 versus IP67 classifications and hardware mitigation strategies.
- **Cross-Platform Support:** Handling inquiries involving distinct company hardware and application separation.
- **Documentation Maintenance:** Correcting [Hardware Specifications](./hardware-specifications.md) (CR2032 vs. CR2450) across blogs and wikis.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt` | text | Unverified |

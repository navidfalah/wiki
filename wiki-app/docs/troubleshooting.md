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
last_updated: "2026-09-10T14:41:01.785408+00:00"
sidebar_label: Troubleshooting
slug: /troubleshooting
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Troubleshooting

## Overview
This wiki page covers troubleshooting guidelines, cross-ticket scenarios, and [product support](./product-support.md) distinctions based on [support training](./support-training.md) roleplays involving various [hardware](./hardware.md) and software ecosystems, including [Nova Widget](./nova-widget.md), [TeaBuddy](./teabuddy.md), and [SenseNode](./sensenode.md) devices.

## Key Details
* **App Ecosystems & Company Separation:** Nova Widget and TeaBuddy belong to different companies. 
  * Nova Widget utilizes the **[MeshSync](./meshsync.md) garden app**.
  * TeaBuddy uses the **[BLE](./ble.md) kitchen app**.
* **SenseNode Waterproof Ratings:** 
  * SenseNode features an **IP67** waterproof rating, whereas our hardware features an **IP54** rating. 
  * For customers comparing the two, recommend using a protective cover and link the comparison page.
* **Ticket #2099 Rejoin Loop:** 
  * This is a known issue. 
  * To resolve, update [firmware](./firmware.md) to version **0.3.8** and maintain a maximum limit of **six nodes**.
* **TeaBuddy [iOS](./ios.md) 18 Pairing:** 
  * Connection and pairing issues on iOS 18 are resolved in version **0.9.3**.
  * Use a long-press reset for the **TB-142** cancel bug.
* **Battery [Documentation](./documentation.md):** 
  * A customer-noted blog typo regarding the CR2450 battery has been addressed; our devices use the **CR2032** battery. 
  * The wiki has been corrected and Alex's blog has been updated accordingly.

## Related Entities
* Nova Widget
* TeaBuddy (including model TB-142)
* SenseNode
* Alex

## Related Concepts
* MeshSync garden app
* BLE kitchen app
* [Firmware updates](./firmware-updates.md) (v0.3.8, v0.9.3)
* IP ratings (IP54 vs. IP67)
* [Battery specifications](./battery-specifications.md) (CR2032 vs. CR2450)

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt` | text | Unverified |

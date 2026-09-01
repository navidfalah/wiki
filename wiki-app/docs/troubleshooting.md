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
last_updated: "2026-09-01T21:25:56.815868+00:00"
sidebar_label: Troubleshooting
slug: /troubleshooting
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Troubleshooting

## Overview
This page compiles troubleshooting procedures, product ecosystem distinctions, and known issue resolutions derived from support training roleplay scenarios involving the [Nova Widget](./nova-widget.md), [TeaBuddy puck](./teabuddy.md), and [SenseNode](./sensenode-sn-400.md) [hardware](./hardware.md).

## Key Details

### Multi-Product Ecosystems and Ownership
* **App Separation:** Nova Widget and TeaBuddy are manufactured by different companies and use separate applications. 
  * Nova Widget utilizes the **[MeshSync](./meshsync.md)** garden app.
  * TeaBuddy utilizes a [BLE](./ble.md)-based kitchen app.
* **Unified Requests:** When customers own both a Nova Widget and a TeaBuddy puck and submit a single app request, support must clarify the distinct app ecosystems.

### Waterproofing and Environmental Ratings
* **SenseNode Comparison:** Customers frequently cite the [waterproofing](./waterproofing.md) capabilities of the SenseNode device.
* **Rating Difference:** SenseNode features an **IP67** waterproof rating, whereas the company's hardware features an **IP54** rating.
* **Action:** Recommend using a protective cover for the lower-rated hardware and provide a link to the comparison page.

### Ticket #2099: Rejoin Loop
* **Status:** Known issue.
* **Resolution:** Update [firmware](./firmware.md) to version **0.3.8**.
* **Configuration Limit:** Advise users to maintain a maximum limit of six nodes in the network.

### TeaBuddy Pairing and Firmware Bugs
* **iOS 18 Pairing:** Pairing issues on iOS 18 are resolved in firmware version **0.9.3**.
* **TB-142 Cancel Bug:** Address the cancel bug on model TB-142 by performing a long-press reset.

### Battery Specification Corrections
* **Blog Typo:** A customer mention regarding a CR2450 battery blog typo has been addressed. 
* **Correction:** The devices actually utilize **CR2032** batteries. Both the internal wiki and Alex's blog have been updated to reflect this correction.

## Related Entities
* **Nova Widget**
* **TeaBuddy (including model TB-142)**
* **SenseNode**
* **Alex**

## Related Concepts
* **MeshSync Garden App**
* **BLE Kitchen App**
* **IP54 / IP67 Waterproof Ratings**
* **[Firmware Updates](./firmware-updates.md) (v0.3.8, v0.9.3)**
* **[Battery Specifications](./battery-specifications.md) (CR2032 vs CR2450)**

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt` | text | Unverified |

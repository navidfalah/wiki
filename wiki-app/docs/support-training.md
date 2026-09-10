---
id: support-training
title: Support Training
tags:
  - alex
  - battery-specification-correction
  - ios-18-pairing-bug
  - ip-rating-comparison
  - nova-widget
  - rejoin-loop-issue
  - sensenode
  - support-training
last_updated: "2026-09-10T14:40:54.413527+00:00"
sidebar_label: Support Training
slug: /support-training
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Support Training

## Overview

This page documents a support training roleplay session covering cross-ticket scenarios involving the [Aurora Nova Widget v2](./aurora-nova-widget-v2.md) and [TeaBuddy](./teabuddy.md) ecosystems, [hardware specifications](./hardware-specifications.md), known [firmware issues](./firmware-issues.md), and [documentation](./documentation.md) corrections.

## Key Details

- **Ecosystem Separation**: The customer owns both the [Nova Widget](./nova-widget.md) and [TeaBuddy](./teabuddy.md) puck but makes a single app request. These are products from different companies:
  - **Nova Widget**: Uses the [MeshSync](./meshsync.md) garden app.
  - **TeaBuddy**: Uses the [BLE](./ble.md) kitchen app.
- **Waterproof Ratings ([SenseNode](./sensenode.md) Comparison)**: 
  - The customer cites the SenseNode, which features an **IP67** rating.
  - Our products feature an **IP54** rating.
  - Support recommendation: Recommend using a protective cover and link the comparison page.
- **Rejoin Loop Issue (Ticket #2099)**:
  - Recognized as a known issue.
  - Resolution: Update firmware to version **0.3.8** and maintain a limit of six nodes.
- **TeaBuddy [iOS](./ios.md) 18 Pairing**:
  - The iOS 18 pairing bug is fixed in version **0.9.3**.
  - For the TB-142 cancel bug, instruct the user to perform a long-press reset.
- **Battery Specification Correction**:
  - A blog post authored by Alex contained a typo regarding the use of CR2450 batteries.
  - Correction: Our devices use **CR2032** batteries. The wiki and Alex's blog post have both been updated.

## Related Entities

- **Nova Widget**
- **TeaBuddy Puck (TB-142)**
- **SenseNode**
- **Alex**

## Related Concepts

- **MeshSync Garden App**
- **BLE Kitchen App**
- **[Firmware Updates](./firmware-updates.md) (v0.3.8, v0.9.3)**
- **IP Ratings (IP54 vs. IP67)**
- **[Battery Specifications](./battery-specifications.md) (CR2032 vs. CR2450)**

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt` | text | Unverified |

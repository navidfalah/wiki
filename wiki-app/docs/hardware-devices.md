---
id: hardware-devices
title: Hardware Devices
tags:
  - alex
  - battery-specification-correction
  - hardware-devices
  - ios-18-pairing-bug
  - ip-rating-comparison
  - nova-widget
  - rejoin-loop-issue
  - sensenode
last_updated: "2026-09-10T14:38:26.721681+00:00"
sidebar_label: Hardware Devices
slug: /hardware-devices
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Devices

## Overview
This wiki page compiles [support training](./support-training.md) roleplay guidelines, [troubleshooting](./troubleshooting.md) steps, and technical specifications regarding various [hardware](./hardware.md) devices and associated software ecosystems, including the [Nova Widget](./nova-widget.md), [TeaBuddy puck](./teabuddy.md), and competitor products like [SenseNode](./sensenode.md).

## Key Details
- **App Ecosystems & Companies:** 
  - Nova Widget and TeaBuddy are produced by different companies. 
  - Nova uses the **[MeshSync](./meshsync.md) garden app**.
  - TeaBuddy uses the **[BLE](./ble.md) kitchen app**.
- **[Waterproofing](./waterproofing.md) & IP Ratings:**
  - Competitor product **SenseNode** features an **IP67** waterproof rating, compared to the local hardware's **IP54** rating.
  - Recommended action for the lower IP rating includes recommending a protective cover and linking the comparison page.
- **Ticket #2099 Rejoin Loop Issue:**
  - This is a known issue.
  - Troubleshooting steps require updating the [firmware](./firmware.md) to version **0.3.8** and keeping the network at a maximum of six nodes.
- **TeaBuddy [iOS](./ios.md) 18 Pairing:**
  - The pairing bug on iOS 18 was fixed in firmware version **0.9.3**.
  - For the TB-142 cancel bug, users should perform a long-press reset.
- **Battery Specification Correction:**
  - A blog typo incorrectly mentioned the CR2450 battery. 
  - The correct battery used is **CR2032**. The wiki and Alex's blog have both been updated to reflect this correction.

## Related Entities
- **Nova Widget**: Smart widget device operating on the MeshSync garden app.
- **TeaBuddy Puck**: Kitchen device operating on a BLE kitchen app, model TB-142.
- **SenseNode**: Competitor hardware device featuring an IP67 waterproof rating.
- **Alex**: Blog author/contributor who assisted with the battery specification correction.

## Related Concepts
- **[Firmware Updates](./firmware-updates.md)**: Essential for resolving bugs such as the Ticket #2099 rejoin loop (v0.3.8) and iOS 18 pairing issues (v0.9.3).
- **IP Ratings**: Environmental protection standards comparing IP54 and IP67 enclosures.
- **Device Pairing & Resets**: Troubleshooting procedures involving long-press resets to clear cancellation bugs during setup.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt` | text | Unverified |

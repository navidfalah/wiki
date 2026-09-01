---
id: software-releases
title: Software Releases
tags:
  - alex-kim
  - aurora-nova-widget
  - ble-pairing-timeout
  - haptic-motor-duty-cycle
  - herbal-preset
  - sam-rivera
  - software-releases
  - teabuddy
last_updated: "2026-09-01T19:21:34.621413+00:00"
sidebar_label: Software Releases
slug: /software-releases
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Software Releases

## Overview
This page documents the [firmware changelog](./firmware-changelog.md) for the [TeaBuddy](./teabuddy.md) v0.9.x series, detailing [bug fixes](./bug-fixes.md), configuration adjustments, and performance improvements across various beta and test builds leading up to July 2026.

## Key Details
- **v0.9.4 (2026-07-01):**
  - Resolved ticket TB-142, fixing an issue where the timer continued running after cancellation in the app (handled by Sam Rivera).
  - Increased the [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) pairing timeout to 45 seconds to accommodate the iOS 18 beta.
  - Aligned the Herbal preset constant to 7:00 (previously set to 5:00 in marketing copy).
- **v0.9.3 (2026-06-28):**
  - Fixed the CoreBluetooth permission prompt order (ticket #2156).
  - Capped the haptic motor duty cycle at 70% following an UX review by Alex Kim.
- **v0.9.2 (2026-06-20):**
  - Released a TestFlight build introducing the box QR pairing path.
  - Reduced CR2032 sleep current draw from 12µA to 9µA.

## Related Entities
- **TeaBuddy**
- **Sam Rivera**
- **Alex Kim**
- **[Aurora Nova Widget](./aurora-nova-widget.md)**

## Related Concepts
- **BLE Pairing Timeout**
- **Haptic Motor Duty Cycle**
- **Herbal Preset**
- **MeshSync**

## Contradictions
&gt; **Contradiction:** The Herbal preset constant was misaligned between marketing copy and firmware implementations. Marketing copy originally stated the preset was 5:00, whereas the firmware aligns it to 7:00 (fixed in firmware only).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |

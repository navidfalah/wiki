---
id: firmware-changelog
title: Firmware Changelog
tags:
  - alex-kim
  - aurora-nova-widget
  - ble-pairing-timeout
  - firmware-changelog
  - haptic-motor-duty-cycle
  - herbal-preset
  - sam-rivera
  - teabuddy
last_updated: "2026-09-01T19:18:38.313015+00:00"
sidebar_label: Firmware Changelog
slug: /firmware-changelog
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Changelog

## Overview
This wiki page documents the version history and updates for the [TeaBuddy](./teabuddy.md) v0.9.x [firmware](./firmware.md) series, capturing critical [bug fixes](./bug-fixes.md), [hardware](./hardware.md) optimizations, and feature adjustments across various release builds.

## Key Details
- **v0.9.4 (2026-07-01):**
  - Resolved TB-142: fixed an issue where the timer continued running after being cancelled in the app (contributed by Sam Rivera).
  - Increased the [BLE](./ble.md) pairing timeout to 45 seconds to accommodate iOS 18 beta requirements.
  - Aligned the Herbal preset constant to 7:00.
- **v0.9.3 (2026-06-28):**
  - Fixed the CoreBluetooth permission prompt order (ticket #2156).
  - Capped the haptic motor duty cycle at 70% following an UX review by Alex Kim.
- **v0.9.2 (2026-06-20):**
  - Released TestFlight build featuring the box QR pairing path.
  - Reduced CR2032 sleep draw from 12µA to 9µA.

## Related Entities
- **TeaBuddy:** The primary hardware device and product line associated with the [firmware updates](./firmware-updates.md).
- **Sam Rivera:** Team member credited with fixing the TB-142 timer bug.
- **Alex Kim:** UX reviewer responsible for requesting the haptic motor duty cycle cap.
- **[Aurora Nova Widget](./aurora-nova-widget.md):** External widget utilized in cross-references.

## Related Concepts
- **BLE Pairing Timeout:** [Bluetooth Low Energy](./bluetooth-low-energy.md) connection window adjustments made for compatibility (specifically iOS 18 beta).
- **Haptic Motor Duty Cycle:** Power limitation put in place for user experience and hardware preservation.
- **MeshSync:** Communication protocol used by the Aurora Nova Widget.

## Contradictions
&gt; **Contradiction:** The Herbal preset duration was previously listed as 5:00 in marketing copy, but the firmware has aligned it to 7:00 (fixed in firmware only).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |

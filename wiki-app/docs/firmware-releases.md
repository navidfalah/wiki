---
id: firmware-releases
title: Firmware Releases
tags:
  - alex-kim
  - aurora-nova-widget
  - ble-pairing-timeout
  - cr2032-sleep-draw
  - firmware-releases
  - haptic-motor-duty-cycle
  - sam-rivera
  - teabuddy
last_updated: "2026-09-10T14:38:10.482924+00:00"
sidebar_label: Firmware Releases
slug: /firmware-releases
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Releases

## Overview
This wiki page documents the v0.9.x [firmware](./firmware.md) release series for the [TeaBuddy](./teabuddy.md) device, capturing critical [bug fixes](./bug-fixes.md), protocol adjustments, and optimizations made across iterative releases in June and July 2026.

## Key Details
The v0.9.x series includes several notable [firmware updates](./firmware-updates.md) with specific improvements:

* **v0.9.4 (2026-07-01):**
  * Resolved ticket TB-142, fixing an issue where the timer continued running after being canceled in the app (reported by Sam Rivera).
  * Increased the [BLE](./ble.md) pairing timeout to 45 seconds to accommodate compatibility with the [iOS](./ios.md) 18 beta.
  * Aligned the herbal preset constant to 7:00.
* **v0.9.3 (2026-06-28):**
  * Fixed the CoreBluetooth permission prompt order (ticket #2156).
  * Capped the haptic motor duty cycle at 70% following the UX review conducted by Alex Kim.
* **v0.9.2 (2026-06-20):**
  * Released to TestFlight with box QR pairing path support.
  * Optimized [power management](./power-management.md), reducing CR2032 sleep draw from 12µA to 9µA.

## Related Entities
* **Sam Rivera:** Identified and reported the timer cancellation bug (TB-142).
* **Alex Kim:** Conducted the UX review that recommended capping the haptic motor duty cycle.
* **[Aurora Labs](./aurora-labs.md):** Creator/associated entity referenced in [hardware](./hardware.md) context.

## Related Concepts
* **BLE Pairing Timeout:** Adjusted to 45 seconds for iOS 18 beta compatibility.
* **CR2032 Sleep Draw:** Optimized [power consumption](./power-consumption.md) during sleep states.
* **Haptic Motor Duty Cycle:** Capped at 70% for improved user experience.

## Contradictions
&gt; **Contradiction:** The herbal preset constant was aligned to 7:00 in firmware v0.9.4, whereas [marketing](./marketing.md) copy previously stated it was 5:00. This discrepancy was resolved in the firmware only.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |

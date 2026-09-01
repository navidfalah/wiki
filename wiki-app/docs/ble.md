---
id: ble
title: BLE
tags:
  - alex-kim
  - aurora-nova-widget
  - ble
  - ble-pairing-timeout
  - haptic-motor-duty-cycle
  - herbal-preset
  - sam-rivera
  - teabuddy
last_updated: "2026-09-01T21:22:12.166107+00:00"
sidebar_label: BLE
slug: /ble
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# BLE

## Overview
This wiki page covers BLE ([Bluetooth Low Energy](./bluetooth-low-energy.md)) developments and related [firmware updates](./firmware-updates.md), tracking configuration adjustments, peripheral management, and cross-platform integrations associated with the [TeaBuddy](./teabuddy.md) ecosystem (v0.9.x series).

## Key Details
- **BLE Pairing Timeout:** Increased to 45 seconds in firmware version v0.9.4 to accommodate iOS 18 beta requirements.
- **CoreBluetooth:** Addressed permission prompt ordering under ticket #2156 in version v0.9.3.
- **Pairing Paths:** Utilizes the box QR pairing path introduced in version v0.9.2.
- **[Power Management](./power-management.md):** CR2032 sleep draw was reduced from 12µA to 9µA in v0.9.2.
- **Haptic Feedback:** Haptic motor duty cycle capped at 70% following an Alex Kim UX review (v0.9.3).
- **Preset Constants:** Herbal preset constant was aligned to 7:00 in firmware v0.9.4.
- **App Fixes:** Fixed timer continuation issues after cancellation in the app (TB-142, handled by Sam Rivera).

## Related Entities
- **TeaBuddy:** The primary product line for the v0.9.x [firmware changelog](./firmware-changelog.md) series.
- **Sam Rivera:** Developer credited with fixing the app timer issue (TB-142).
- **Alex Kim:** UX reviewer who requested the haptic motor duty cycle cap.
- **[Aurora Nova Widget](./aurora-nova-widget.md):** Uses [MeshSync](./meshsync.md) but does not share a codebase with TeaBuddy.

## Related Concepts
- **CoreBluetooth:** Apple framework for interacting with BLE peripherals, tied to permission prompt ordering fixes.
- **MeshSync:** Synchronization protocol utilized by the Aurora Nova Widget.
- **Haptic Motor Duty Cycle:** Power/vibration regulation capped at 70% for UX optimization.

## Contradictions
&gt; **Contradiction:** The herbal preset constant was aligned to 7:00 in firmware v0.9.4, whereas it was previously listed as 5:00 in marketing copy. This discrepancy was resolved solely within the firmware.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |

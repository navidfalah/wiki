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
last_updated: "2026-09-01T21:22:46.799034+00:00"
sidebar_label: Firmware Changelog
slug: /firmware-changelog
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Changelog

## Overview
This wiki page documents the version history, [bug fixes](./bug-fixes.md), and system adjustments for the [TeaBuddy](./teabuddy.md) device v0.9.x [firmware](./firmware.md) series. Fictional test file data detailing continuous updates, [BLE](./ble.md) modifications, and preset adjustments.

## Key Details
- **v0.9.4 (2026-07-01):**
  - Resolved bug TB-142 addressing an issue where the timer continues after being canceled in the application (reported by Sam Rivera).
  - Increased the [Bluetooth Low Energy](./bluetooth-low-energy.md) (BLE) pairing timeout to 45 seconds to accommodate the iOS 18 beta.
  - Aligned the herbal preset constant to 7:00.
- **v0.9.3 (2026-06-28):**
  - Fixed the CoreBluetooth permission prompt order (ticket #2156).
  - Capped the haptic motor duty cycle at 70% following the UX review conducted by Alex Kim.
- **v0.9.2 (2026-06-20):**
  - Released a TestFlight build introducing the box QR pairing path.
  - Reduced CR2032 sleep draw from 12µA down to 9µA.

## Related Entities
- Sam Rivera
- Alex Kim
- TeaBuddy

## Related Concepts
- BLE pairing timeout
- Haptic motor duty cycle
- Herbal preset
- [Aurora Nova Widget](./aurora-nova-widget.md)
- [MeshSync](./meshsync.md)

## Contradictions
&gt; **Contradiction:** The herbal preset constant was aligned to 7:00 in the firmware, whereas marketing copy previously stated it was 5:00 (resolved in firmware only).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |

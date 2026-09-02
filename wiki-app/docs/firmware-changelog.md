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
last_updated: "2026-09-02T06:39:25.788309+00:00"
sidebar_label: Firmware Changelog
slug: /firmware-changelog
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Changelog

## Overview
This wiki page documents the release history and updates for the [TeaBuddy](./teabuddy.md) v0.9.x [firmware](./firmware.md) series, capturing critical [bug fixes](./bug-fixes.md), improvements, and cross-functional feature updates.

## Key Details
- **v0.9.4 (2026-07-01):**
  - Resolved bug TB-142 where the timer continued to run after being canceled in the app (noted by Sam Rivera).
  - Increased the [BLE](./ble.md) pairing timeout to 45 seconds to accommodate iOS 18 beta requirements.
  - Aligned the Herbal preset constant to 7:00.
- **v0.9.3 (2026-06-28):**
  - Implemented a fix for the CoreBluetooth permission prompt order (ticket #2156).
  - Capped the haptic motor duty cycle at 70% following an UX review by Alex Kim.
- **v0.9.2 (2026-06-20):**
  - Released a TestFlight build introducing the box QR pairing path.
  - Reduced CR2032 sleep draw from 12µA to 9µA.

## Related Entities
- **Sam Rivera:** Reported/addressed the timer bug (TB-142).
- **Alex Kim:** Conducted the UX review that led to the haptic motor duty cycle cap.
- **TeaBuddy:** The primary device line undergoing the v0.9.x firmware iterations.

## Related Concepts
- **BLE Pairing Timeout:** Adjusted to 45 seconds for better compatibility with iOS 18 beta.
- **Haptic Motor Duty Cycle:** Capped at 70% for optimized user experience.
- **[MeshSync](./meshsync.md) / [Aurora Nova Widget](./aurora-nova-widget.md):** Operates separately from the TeaBuddy firmware (not a shared codebase).

## Contradictions
&gt; **Contradiction:** The Herbal preset constant was aligned to 7:00 in the firmware, whereas it was originally set to 5:00 in the marketing copy. This discrepancy was resolved by updating the firmware only.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |

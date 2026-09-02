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
last_updated: "2026-09-02T06:38:49.866831+00:00"
sidebar_label: BLE
slug: /ble
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# BLE

## Overview
This page documents [Bluetooth Low Energy](./bluetooth-low-energy.md) (BLE) updates, configurations, and related [Firmware Changelog](./firmware-changelog.md) details for the [TeaBuddy](./teabuddy.md) device and its accompanying application ecosystem.

## Key Details
- **BLE Pairing Timeout:** Increased to 45 seconds specifically to accommodate iOS 18 beta requirements (v0.9.4).
- **CoreBluetooth Integration:** Resolved CoreBluetooth permission prompt ordering via ticket #2156 in version v0.9.3.
- **Related Firmware Milestones:**
  - v0.9.4: Fixed timer persistence issues after app cancellation (noted by Sam Rivera) and aligned the herbal preset constant.
  - v0.9.3: Capped the haptic motor duty cycle at 70% following an Alex Kim UX review.
  - v0.9.2: Included TestFlight builds, box QR pairing paths, and CR2032 sleep draw reductions (12µA down to 9µA).

## Related Entities
- **TeaBuddy:** The [hardware](./hardware.md) and software product associated with the v0.9.x firmware series.
- **Sam Rivera:** Noted in connection with fixing the timer-continuation bug (TB-142).
- **Alex Kim:** Conducted the UX review that capped the haptic motor duty cycle.
- **[Aurora Nova Widget](./aurora-nova-widget.md):** Utilizes [MeshSync](./meshsync.md) technology.

## Related Concepts
- **CoreBluetooth:** Apple's framework utilized for managing Bluetooth connections and permission prompts on iOS devices.
- **MeshSync:** A separate synchronization mechanism used by the Aurora Nova Widget, noted as not sharing a codebase with TeaBuddy's BLE implementation.
- **Haptic Feedback:** Controlled via the haptic motor duty cycle capped at 70%.

## Contradictions
&gt; **Contradiction:** The herbal preset constant was aligned to 7:00 in firmware v0.9.4, whereas it was previously listed as 5:00 in marketing copy (noted as fixed in firmware only).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |

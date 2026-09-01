---
id: software-releases
title: Software Releases
tags:
  - alex-kim
  - aurora-nova-widget
  - ble-pairing-timeout
  - haptic-motor-duty-icon
  - herbal-preset
  - sam-rivera
  - software-releases
  - teabuddy
last_updated: "2026-09-01T21:25:39.134555+00:00"
sidebar_label: Software Releases
slug: /software-releases
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Software Releases

## Overview
This wiki page covers the software and [firmware](./firmware.md) release history for the [TeaBuddy](./teabuddy.md) product ecosystem, focusing on the v0.9.x series updates. It details [bug fixes](./bug-fixes.md), feature enhancements, and [hardware](./hardware.md) parameter adjustments across multiple minor releases.

## Key Details
- **v0.9.4 (2026-07-01)**
  - Fixed ticket TB-142: timer continues after cancel in app (led by Sam Rivera).
  - Increased [BLE](./ble.md) pairing timeout to 45 seconds to accommodate the iOS 18 beta.
  - Aligned the herbal preset constant to 7:00.
- **v0.9.3 (2026-06-28)**
  - Fixed CoreBluetooth permission prompt order (ticket #2156).
  - Capped the haptic motor duty cycle at 70% following the UX review by Alex Kim.
- **v0.9.2 (2026-06-20)**
  - Released TestFlight build supporting box QR pairing path.
  - Reduced CR2032 sleep draw from 12µA down to 9µA.

## Related Entities
- **Sam Rivera**: Contributed to fixing ticket TB-142 regarding the timer continuing after cancellation.
- **Alex Kim**: Conducted the UX review that resulted in capping the haptic motor duty cycle.
- **TeaBuddy**: The primary product line associated with the v0.9.x [firmware changelog](./firmware-changelog.md).
- **[Aurora Nova Widget](./aurora-nova-widget.md)**: Uses [MeshSync](./meshsync.md), though it operates on a separate codebase.

## Related Concepts
- **BLE Pairing Timeout**: Adjusted in v0.9.4 to 45 seconds for compatibility with iOS 18 beta.
- **Haptic Motor Duty Cycle**: Limited to a maximum of 70% for improved user experience.
- **Herbal Preset**: Standardized in firmware to a 7:00 duration.

## Contradictions
&gt; **Contradiction:** The herbal preset constant was aligned to 7:00 in firmware v0.9.4, whereas marketing copy previously stated it was 5:00. This discrepancy was resolved solely within the firmware.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |

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
last_updated: "2026-09-01T19:18:01.547751+00:00"
sidebar_label: BLE
slug: /ble
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# BLE

## Overview
This wiki page compiles information regarding BLE ([Bluetooth Low Energy](./bluetooth-low-energy.md)) integrations, [firmware updates](./firmware-updates.md), and related engineering changes for the [TeaBuddy](./teabuddy.md) product line based on the v0.9.x [firmware changelog](./firmware-changelog.md) series.

## Key Details
- **BLE Pairing Timeout:** Increased to 45 seconds specifically to accommodate iOS 18 beta builds (v0.9.4).
- **CoreBluetooth:** Addressed permission prompt ordering in ticket #2156 (v0.9.3).
- **Pairing Paths:** Utilizes a box QR pairing path introduced in TestFlight builds (v0.9.2).
- **Power Efficiency:** CR2032 sleep draw was optimized, reducing [power consumption](./power-consumption.md) from 12µA to 9µA (v0.9.2).

## Related Entities
- **TeaBuddy:** The primary [hardware](./hardware.md)/software product undergoing the v0.9.x firmware iterations.
- **Sam Rivera:** Developer or engineer credited with fixing ticket TB-142 regarding the app timer.
- **Alex Kim:** UX reviewer responsible for requesting the haptic motor duty cycle cap.
- **[Aurora Nova Widget](./aurora-nova-widget.md):** Uses MeshSync technology, though it does not share a codebase with TeaBuddy.

## Related Concepts
- **Firmware Changelog:** Documenting iterative fixes such as timer bugs, permission prompts, and timeout adjustments.
- **Haptic Motor Duty Cycle:** Capped at a maximum of 70% following UX review (v0.9.3).
- **Herbal Preset:** Standardized in firmware to 7:00.

## Contradictions
&gt; **Contradiction:** The Herbal preset constant was aligned to 7:00 in the firmware, whereas it was previously listed as 5:00 in marketing copy (fixed in firmware only during v0.9.4).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |

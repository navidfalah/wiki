---
id: ble
title: BLE
tags:
  - alex-kim
  - aurora-labs
  - aurora-nova-widget
  - background-task-renewal
  - ble
  - ble-pairing-timeout
  - corebluetooth-pairing-changes
  - cr2032-sleep-draw
last_updated: "2026-09-10T14:37:28.112127+00:00"
sidebar_label: BLE
slug: /ble
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# BLE

## Overview

[Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) technology is utilized across [firmware](./firmware.md) implementations and [hardware](./hardware.md) accessories (such as the [TeaBuddy](./teabuddy.md) device). Recent engineering updates focus on pairing timeouts, [iOS](./ios.md) 18 CoreBluetooth permission handling, background timer persistence, and battery optimization.

## Key Details

- **BLE Pairing Timeout:** Increased to 45 seconds in firmware version v0.9.4 to accommodate iOS 18 beta changes.
- **CoreBluetooth & Permissions:**
  - Changes in iOS 18 beta altered permission prompt order, resulting in ticket #2156.
  - `CBManagerAuthorization` must resolve prior to triggering a GATT connection via a QR deep link.
- **Background Tasks:** The background steep timer requires `UIBackgroundTask` renewal to resolve the TB-background-kill bug.
- **Power Optimization:** CR2032 sleep draw was successfully reduced from 12µA to 9µA in version v0.9.2.

## Related Entities

- **TeaBuddy:** The primary device associated with the v0.9.x [firmware changelog](./firmware-changelog.md) and iOS 18 [research notes](./research-notes.md).
- **[Aurora Labs](./aurora-labs.md):** Mentioned in context with the [Aurora Nova Widget](./aurora-nova-widget.md).
- **Sam Rivera:** Author of the iOS 18 research notes and contributor to the TeaBuddy [firmware updates](./firmware-updates.md).
- **Alex Kim:** Conducted the UX review that capped the haptic motor duty cycle at 70%.

## Related Concepts

- **CoreBluetooth:** Apple's framework managing Bluetooth peripherals and central devices, heavily impacted by iOS 18 pairing and authorization changes.
- **GATT Connect:** The Generic Attribute Profile connection protocol triggered following QR deep links.
- **UIBackgroundTask:** Used for handling background timer renewal to prevent app termination during active operations.

## Contradictions

&gt; **Contradiction:** The herbal preset constant was aligned to 7:00 in firmware v0.9.4, whereas [marketing](./marketing.md) copy had previously stated 5:00 (fixed in firmware only).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |
| 2 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

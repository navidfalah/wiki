---
id: teabuddy
title: TeaBuddy
tags:
  - alex-kim
  - apple
  - aurora-mira
  - aurora-nova-widget
  - battery-specifications
  - beta-nps
  - ble-pairing
  - ble-pairing-timeout
last_updated: "2026-09-01T21:25:52.599198+00:00"
sidebar_label: TeaBuddy
slug: /teabuddy
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# TeaBuddy

## Overview

[TeaBuddy](./teabuddy.md) is a consumer smart-tea device and associated ecosystem managed by a fictional startup team including Alex Kim, Jamie (QA), and Sam Rivera. It utilizes [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) for connectivity rather than [mesh networking](./mesh-networking.md), distinguishing its architecture from products like the [Aurora Nova Widget](./aurora-nova-widget.md). The project has undergone multiple [firmware](./firmware.md) iterations in the v0.9.x series, focusing on refining pairing stability for iOS 18 beta compatibility, adjusting haptic feedback limits, and optimizing [power consumption](./power-consumption.md).

## Key Details

- **Connectivity & Pairing:** Uses BLE for device connection. The BLE pairing timeout was increased to 45 seconds to accommodate iOS 18 beta changes (Ticket #2156). CoreBluetooth permission prompt ordering was addressed in firmware v0.9.3 to resolve authorization issues before triggering QR deep link GATT connections.
- **[Hardware](./hardware.md) & Power:** Powered by a CR2032 coin cell battery. Sleep draw was successfully reduced from 12 µA down to 9 µA in firmware v0.9.2.
- **UI & Haptics:** The haptic motor duty cycle is capped at 70% following UX reviews by Alex Kim.
- **Metrics:** Beta Net Promoter Score (NPS) sits at a raw score of 42, with pairing complaints noting a decrease following firmware version 0.9.3.

## Related Entities

- **Alex Kim:** Product team lead focusing on marketing collateral, UX reviews, and project focus.
- **Sam Rivera:** Engineering/firmware lead managing [firmware updates](./firmware-updates.md), ticket resolutions, and iOS pairing research.
- **Jamie (QA):** Quality assurance tracking test builds, bug tickets, and beta NPS metrics.
- **Aurora Nova Widget & [Aurora Mira](./nova-widget.md):** Related projects or product lines developed in parallel; the Nova Widget uses [MeshSync](./meshsync.md) and a pebble shape (not sharing a codebase with TeaBuddy), while Aurora Mira explored a shared booth arrangement.

## Related Concepts

- **iOS 18 CoreBluetooth Changes:** Altered permission prompt ordering, requiring `CBManagerAuthorization` to resolve prior to GATT connection triggers and necessitating `UIBackgroundTask` renewals for background steep timers.
- **Firmware Iterations:** Active development tracked across the v0.9.x series, incorporating box QR pairing paths, TestFlight builds, and [bug fixes](./bug-fixes.md) such as TB-142 (timer cancellation issues).

## Contradictions

&gt; **Contradiction:** There is an ongoing discrepancy regarding the herbal steep preset duration. Firmware and the wiki establish the constant at 7:00, whereas early marketing copies, print proofs (v3), and a marketing PDF state 5:00. Firmware v0.9.4 aligned the constant to 7:00, prompting a need to correct physical print proofs.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |
| 2 | `dummy-test/2026-07-06-slack-dump-product.txt` | text | Unverified |
| 3 | `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md` | text | Unverified |
| 4 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

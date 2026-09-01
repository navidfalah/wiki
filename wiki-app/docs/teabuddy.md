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
last_updated: "2026-09-01T19:21:47.116994+00:00"
sidebar_label: TeaBuddy
slug: /teabuddy
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# TeaBuddy

## Overview

[TeaBuddy](./teabuddy.md) is a smart tea steeping companion device and associated mobile application developed by a fictional startup team including Alex Kim (UX/Product), Sam Rivera (Engineering), and Jamie (QA). The device utilizes [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) for connectivity, distinguishes itself from mesh-based products like the [Aurora Nova Widget](./aurora-nova-widget.md), and runs on CR2032 coin cell batteries.

## Key Details

- **[Firmware](./firmware.md) & Version History:** 
  - Version `0.9.2` introduced TestFlight builds, box QR pairing paths, and reduced CR2032 sleep draw from 12 µA down to 9 µA.
  - Version `0.9.3` addressed CoreBluetooth permission prompt ordering (ticket #2156) and capped the haptic motor duty cycle at 70% per UX review.
  - Version `0.9.4` fixed TB-142 (timer continuing after cancel in app) and increased the BLE pairing timeout to 45 seconds to accommodate changes in iOS 18 beta.
- **[Battery Specifications](./battery-specifications.md):** Powered by a CR2032 battery (disproving early [documentation](./documentation.md) references to the CR2450 format).
- **Performance & Metrics:** Beta Net Promoter Score (NPS) stands at 42, with pairing complaints dropping following the `0.9.3` update.

## Related Entities

- **Alex Kim:** Product and UX lead managing print proofs, product direction, and stakeholder coordination.
- **Sam Rivera:** Lead engineer handling firmware fixes, BLE pairing optimizations, and cross-codebase boundaries.
- **Jamie:** QA engineer tracking ticket regressions and beta NPS metrics.
- **Aurora Nova Widget / [Aurora Mira](./aurora-labs.md):** Separate products utilizing MeshSync and UART provisioning; the TeaBuddy team rejected a shared booth with Aurora Mira unless costs are split evenly.

## Related Concepts

- **BLE Pairing:** Uses consumer QR code flows and GATT connections, requiring strict sequencing with iOS CoreBluetooth permission prompts (`CBManagerAuthorization`).
- **Background Steep Timers:** Relies on `UIBackgroundTask` renewal to prevent background termination bugs on mobile devices.

## Contradictions

&gt; **Contradiction:** The herbal preset steep time duration contains a discrepancy between firmware implementation and marketing collateral. Firmware and internal wiki constants define the herbal preset duration as 7:00, whereas early print proofs and marketing PDFs (such as print proof v3) state it is 5:00. This mismatch was corrected in firmware v0.9.4, though print materials required physical corrections.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |
| 2 | `dummy-test/2026-07-06-slack-dump-product.txt` | text | Unverified |
| 3 | `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md` | text | Unverified |
| 4 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

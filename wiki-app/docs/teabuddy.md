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
last_updated: "2026-09-10T14:40:56.915848+00:00"
sidebar_label: TeaBuddy
slug: /teabuddy
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# TeaBuddy

## Overview
[TeaBuddy](./teabuddy.md) is a smart tea-brewing companion device and application ecosystem developed by a fictional startup team including Alex Kim, Jamie (QA), and Sam Rivera. The project relies on [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) for device connectivity and features companion mobile applications supporting [iOS](./ios.md) and Android.

## Key Details
- **[Firmware Updates](./firmware-updates.md):** Recent firmware iterations (v0.9.x series) have targeted [bug fixes](./bug-fixes.md) and pairing improvements. Version v0.9.3 addressed CoreBluetooth permission prompt ordering (ticket #2156), capped the haptic motor duty cycle at 70% per UX review, and reduced CR2032 sleep draw down to 9 µA (with earlier [hardware](./hardware.md) notes citing sleep draw values of 4.2 µA). Version v0.9.4 further extended the BLE pairing timeout to 45 seconds to accommodate changes in iOS 18 beta.
- **Herbal Preset Duration:** A notable discrepancy exists regarding the herbal preset steep time. Firmware enforces a 7:00 duration, whereas earlier [marketing](./marketing.md) copy and print proofs (v3) specified 5:00.
- **Metrics:** Beta Net Promoter Score (NPS) currently stands at 42, with pairing complaints decreasing following the v0.9.3 firmware release.

## Related Entities
- **Alex Kim:** Product lead focusing on feature scope and marketing print corrections.
- **Sam Rivera:** Engineering/firmware lead managing technical constraints, bug fixes, and BLE pairing adjustments.
- **Jamie:** [Quality Assurance](./quality-assurance.md) (QA) handling test builds, ticket tracking, and NPS tracking.
- **[Aurora Mira](./aurora-nova-widget-v2.md):** External entity that previously pinged regarding a shared trade show booth.

## Related Concepts
- **BLE Pairing & iOS 18:** iOS 18 beta introduced changes to CoreBluetooth permission prompt ordering (`CBManagerAuthorization` must resolve before QR deep link GATT connections), necessitating an extended 45-second timeout and background task renewals (`UIBackgroundTask`).
- **[Aurora Nova Widget](./aurora-nova-widget.md):** A separate product utilizing the [MeshSync Protocol](./meshsync-protocol.md), pebble shape, and UART provisioning rather than consumer QR flows. It does not share a codebase with TeaBuddy.

## Contradictions
&gt; **Contradiction:** The herbal preset duration is inconsistently documented. Firmware sets the constant to 7:00, while marketing materials and print proof v3 specify 5:00. Firmware was updated to enforce 7:00, but marketing collateral required physical corrections.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-01-firmware-changelog.md` | text | Unverified |
| 2 | `dummy-test/2026-07-06-slack-dump-product.txt` | text | Unverified |
| 3 | `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md` | text | Unverified |
| 4 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

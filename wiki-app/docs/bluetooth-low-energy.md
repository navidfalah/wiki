---
id: bluetooth-low-energy
title: Bluetooth Low Energy
tags:
  - apple
  - ble-pairing
  - bluetooth-low-energy
  - cbmanagerauthorization
  - nova-widget
  - sam-rivera
  - teabuddy
  - uibackgroundtask
last_updated: "2026-09-01T19:18:03.262729+00:00"
sidebar_label: Bluetooth Low Energy
slug: /bluetooth-low-energy
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bluetooth Low Energy

## Overview
Bluetooth Low Energy ([BLE](./ble.md)) integration and pairing behavior underwent notable changes in iOS 18 beta, impacting consumer applications such as [TeaBuddy](./teabuddy.md). Research conducted by Sam Rivera explored these modifications regarding permission prompt ordering and background task management.

## Key Details
- **iOS 18 Permission Changes:** Apple modified the permission prompt order in iOS 18 beta, which directly triggered TeaBuddy ticket #2156. 
- **GATT Connection Requirements:** `CBManagerAuthorization` must now completely resolve before a QR deep link is permitted to trigger a GATT connection.
- **Background Task Management:** The background steep timer requires `UIBackgroundTask` renewal to prevent background termination bugs (tracked as the TB-background-kill bug).
- **TeaBuddy Updates:** Action items included shipping version 0.9.3 to resolve the issue and documenting the ordering requirement in the Android kickoff to prevent similar mistakes.

## Related Entities
- **Sam Rivera:** Author of the iOS 18 CoreBluetooth pairing research notes for TeaBuddy.
- **TeaBuddy:** Consumer application affected by the iOS 18 BLE permission prompt order changes (Ticket #2156).
- **[Nova Widget](./nova-widget.md):** Internal project utilizing UART provisioning rather than a consumer QR flow, exhibiting minimal relevance to these specific iOS 18 pairing changes.

## Related Concepts
- **CoreBluetooth:** Apple framework managing Bluetooth Low Energy devices on iOS, specifically involving `CBManagerAuthorization`.
- **Background Tasks:** Mechanism (`UIBackgroundTask`) used to maintain app execution states during operations like background steep timers.
- **UART Provisioning:** An alternative connection and provisioning method used by Nova Widget, distinct from the consumer QR-based BLE flow.

## Contradictions
*No contradictions present in the current source material.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

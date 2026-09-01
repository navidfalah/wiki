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
last_updated: "2026-09-01T21:22:13.592684+00:00"
sidebar_label: Bluetooth Low Energy
slug: /bluetooth-low-energy
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bluetooth Low Energy

## Overview
Bluetooth Low Energy ([BLE](./ble.md)) implementations, particularly on mobile operating systems like iOS 18, require careful management of permissions, background tasks, and connection flows to ensure stability and proper user experience.

## Key Details
- **iOS 18 Pairing Changes:** Apple's iOS 18 beta introduced changes to the permission prompt order, which surfaced issues such as [TeaBuddy](./teabuddy.md) ticket #2156.
- **Authorization Requirements:** `CBManagerAuthorization` must be fully resolved before any QR deep link triggers a GATT connection.
- **Background Operations:** Background steep timers require `UIBackgroundTask` renewal to prevent background termination bugs (such as the TB-background-kill bug).

## Related Entities
- **Sam Rivera (TeaBuddy):** Researcher and author who documented the iOS 18 CoreBluetooth pairing changes and findings for TeaBuddy.
- **TeaBuddy:** Product/project affected by iOS 18 permission ordering and background task issues (Ticket #2156).
- **[Nova Widget](./nova-widget.md):** A separate product featuring minimal [Aurora](./nova-widget.md) relevance that utilizes UART provisioning instead of a consumer QR flow.

## Related Concepts
- **CoreBluetooth:** Apple's framework for interacting with Bluetooth low energy devices.
- **GATT Connect:** The generic attribute profile connection process used by BLE devices.
- **UIBackgroundTask:** iOS mechanism for handling background task lifecycles and expirations.
- **UART Provisioning:** An alternative provisioning method used by Nova Widget.

## Contradictions
*No contradictions reported in the current research notes.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

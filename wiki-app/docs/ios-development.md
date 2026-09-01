---
id: ios-development
title: iOS Development
tags:
  - apple
  - ble-pairing
  - cbmanagerauthorization
  - ios-development
  - nova-widget
  - sam-rivera
  - teabuddy
  - uibackgroundtask
last_updated: "2026-09-01T21:23:33.955793+00:00"
sidebar_label: iOS Development
slug: /ios-development
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# iOS Development

## Overview
iOS development encompasses building applications for Apple's mobile operating system, involving specific considerations for platform updates, background tasks, and [hardware](./hardware.md) connectivity [protocols](./protocols.md) like [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)). Recent research on iOS 18 highlights important permission and lifecycle management requirements for connected hardware products such as [TeaBuddy](./teabuddy.md).

## Key Details
- **iOS 18 CoreBluetooth Changes:** Beta releases for iOS 18 altered the permission prompt order, resulting in connectivity issues (noted as TeaBuddy ticket #2156). 
- **Authorization Requirements:** `CBManagerAuthorization` must now completely resolve before a QR deep link can successfully trigger a GATT connection.
- **Background Processes:** Background steep timers require proper `UIBackgroundTask` renewal to prevent unexpected process termination (associated with the TB-background-kill bug).

## Related Entities
- **Sam Rivera:** Author of the TeaBuddy iOS 18 BLE pairing research notes.
- **TeaBuddy:** A hardware product/project affected by the iOS 18 permission prompt changes (Ticket #2156).
- **[Nova Widget](./nova-widget.md):** A separate project utilizing UART provisioning rather than a consumer QR flow, exhibiting minimal relevance to the iOS 18 QR pairing issue.

## Related Concepts
- **BLE Pairing:** Bluetooth Low Energy connection workflows, heavily dependent on precise prompt timing and authorization states in modern iOS versions.
- **Background Tasks:** Managing app lifecycles via `UIBackgroundTask` to keep timers and processes alive while running in the background.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

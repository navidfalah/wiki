---
id: bug-tracking
title: Bug Tracking
tags:
  - apple
  - ble-pairing
  - bug-tracking
  - cbmanagerauthorization
  - nova-widget
  - sam-rivera
  - teabuddy
  - uibackgroundtask
last_updated: "2026-09-01T21:22:21.184879+00:00"
sidebar_label: Bug Tracking
slug: /bug-tracking
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bug Tracking

## Overview
Bug tracking involves identifying, documenting, and resolving software defects and workflow issues across various platforms and applications, such as managing permission prompt changes introduced in iOS 18 beta for the [TeaBuddy](./teabuddy.md) application.

## Key Details
- **iOS 18 CoreBluetooth Changes:** An iOS 18 beta update altered the permission prompt order, resulting in TeaBuddy ticket #2156.
- **Technical Requirements:** 
  - `CBManagerAuthorization` must resolve prior to a QR deep link triggering a GATT connection.
  - Background steep timers require `UIBackgroundTask` renewal to address the `TB-background-kill` bug.
- **Action Items:** 
  - Ship version 0.9.3 fix.
  - Document the findings for the Android kickoff to prevent similar ordering mistakes.

## Related Entities
- **Sam Rivera:** Author and researcher from TeaBuddy.
- **TeaBuddy:** Product associated with ticket #2156, the consumer QR flow, and version 0.9.3.
- **[Nova Widget](./nova-widget.md):** Product utilizing UART provisioning instead of the consumer QR flow, with minimal relevance to the iOS 18 [BLE](./ble.md) pairing changes.

## Related Concepts
- **BLE ([Bluetooth Low Energy](./bluetooth-low-energy.md)):** Wireless technology framework affected by iOS 18 CoreBluetooth pairing updates.
- **App Permissions & Background Tasks:** Management of `CBManagerAuthorization` and `UIBackgroundTask` renewals.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

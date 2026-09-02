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
last_updated: "2026-09-02T06:38:59.412443+00:00"
sidebar_label: Bug Tracking
slug: /bug-tracking
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bug Tracking

## Overview
Bug tracking involves identifying, documenting, and resolving software defects across various projects. Recent research notes by Sam Rivera ([TeaBuddy](./teabuddy.md)) highlight critical [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) pairing issues introduced by iOS 18 beta changes, specifically impacting TeaBuddy ticket #2156.

## Key Details
- **iOS 18 BLE Pairing Changes:** Apple's iOS 18 beta altered the permission prompt order, causing failures in consumer QR flow pairing.
- **`CBManagerAuthorization`:** This authorization state must resolve completely before a QR deep link is allowed to trigger a GATT connection (`CBManagerAuthorization` must resolve before QR deep link triggers GATT connect).
- **Background Steep Timer:** The background steep timer requires `UIBackgroundTask` renewal to prevent the `TB-background-kill` bug.
- **Action Items:** 
  - Ship the 0.9.3 fix for TeaBuddy.
  - Document the issue in the Android kickoff to avoid repeating the same ordering mistake.

## Related Entities
- **Sam Rivera:** Author of the research notes and representative of TeaBuddy.
- **TeaBuddy:** Product experiencing ticket #2156 and the `TB-background-kill` bug.
- **[Nova Widget](./nova-widget.md):** [Aurora Nova Widget v2](./aurora-nova-widget-v2.md) project utilizing UART provisioning rather than the consumer QR flow, resulting in minimal relevance to the iOS 18 BLE pairing changes.
- **Apple:** Provider of iOS 18 beta [Release Notes](./release-notes.md).

## Related Concepts
- **BLE Pairing:** Bluetooth Low Energy connection and pairing flows, susceptible to permission prompt order changes in modern mobile operating systems.
- **Background Tasks:** Managing application lifecycles and background execution limits using utilities like `UIBackgroundTask`.

## Contradictions
*(No contradictions present in the current sources.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

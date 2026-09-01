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
last_updated: "2026-09-01T19:18:11.457161+00:00"
sidebar_label: Bug Tracking
slug: /bug-tracking
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bug Tracking

## Overview
This wiki page documents bug tracking insights and technical findings related to mobile platform updates, specifically focusing on iOS 18 CoreBluetooth pairing changes, associated ticket incidents for [TeaBuddy](./teabuddy.md), and implications for other projects like [Nova Widget](./nova-widget.md).

## Key Details
- **Author:** Sam Rivera (TeaBuddy)
- **iOS 18 CoreBluetooth Changes:** An iOS 18 beta change to the permission prompt order directly caused TeaBuddy ticket #2156.
- **Technical Findings:**
  - `CBManagerAuthorization` must be fully resolved before any QR deep link triggers a GATT connection.
  - The background steep timer requires `UIBackgroundTask` renewal to prevent the `TB-background-kill` bug.
- **Action Items:**
  - Ship the 0.9.3 fix.
  - Document the issue during the Android kickoff to avoid repeating the same ordering mistake.

## Related Entities
- **TeaBuddy:** Product affected by iOS 18 permission prompt order changes (ticket #2156).
- **Nova Widget:** Uses UART provisioning rather than the consumer QR flow, resulting in minimal [Aurora Labs](./aurora-labs.md) relevance for this specific issue.
- **Sam Rivera:** Author of the research notes.

## Related Concepts
- **[BLE](./ble.md) Pairing:** [Bluetooth Low Energy](./bluetooth-low-energy.md) pairing affected by permission prompt alterations in mobile operating systems.
- **CoreBluetooth:** Apple framework involved in Bluetooth connection management (`CBManagerAuthorization`).
- **Background Tasks:** Management of application lifecycles and timers (`UIBackgroundTask`).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

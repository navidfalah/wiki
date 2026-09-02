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
last_updated: "2026-09-02T06:40:15.445627+00:00"
sidebar_label: iOS Development
slug: /ios-development
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# iOS Development

## Overview

iOS development encompasses building applications for Apple's mobile operating system, involving specific considerations for [Hardware](./hardware.md) integration, permissions, background execution, and system framework updates. Recent changes in iOS 18 beta have introduced important modifications to [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) pairing workflows and permission prompt orders, impacting connected hardware applications such as [TeaBuddy](./teabuddy.md).

## Key Details

- **CoreBluetooth Changes in iOS 18:** iOS 18 beta altered the permission prompt order, which directly caused TeaBuddy ticket #2156. 
- **Permission Resolution:** `CBManagerAuthorization` must now completely resolve before a QR deep link is allowed to trigger a GATT connection.
- **Background Tasks:** Background steep timers require proper `UIBackgroundTask` renewal to prevent the background-kill bug (`TB-background-kill`).
- **Action Items & Fixes:** 
  - Release version 0.9.3 to address the pairing and background issues.
  - Document the permission ordering requirements in the Android [Project Kickoff](./project-kickoff.md) to prevent parallel implementation mistakes.

## Related Entities

- **Sam Rivera:** Author of the research notes and representative of TeaBuddy.
- **TeaBuddy:** Application affected by the iOS 18 BLE pairing permission prompt changes (TeaBuddy ticket #2156).
- **[Nova Widget](./nova-widget.md):** A separate product utilizing UART provisioning rather than a consumer QR flow, exhibiting minimal relevance to the iOS 18 pairing bug.

## Related Concepts

- **BLE Pairing:** Bluetooth Low Energy connection and pairing flows, particularly as managed by Apple's CoreBluetooth framework.
- **CBManagerAuthorization:** The authorization state governing CoreBluetooth access on iOS.
- **UIBackgroundTask:** API used to manage background execution time and prevent application termination during extended tasks like timers.

## Contradictions

*(No contradictions identified in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

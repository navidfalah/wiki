---
id: ios-development
title: "iOS Development: CoreBluetooth Pairing & Background Tasks"
tags:
  - apple
  - ble-pairing
  - cbmanagerauthorization
  - ios-development
  - nova-widget
  - sam-rivera
  - teabuddy
  - uibackgroundtask
last_updated: "2026-09-01T19:19:26.049392+00:00"
sidebar_label: "iOS Development: CoreBluetooth Pairing & Background Tasks"
slug: /ios-development
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# iOS Development: CoreBluetooth Pairing & Background Tasks

## Overview
This wiki page documents critical findings and research regarding iOS 18 CoreBluetooth pairing changes, permission flows, and background execution requirements impacting applications like [TeaBuddy](./teabuddy.md), based on findings by Sam Rivera.

## Key Details
- **iOS 18 Permission Prompt Changes:** Changes to the permission prompt order in iOS 18 betas directly led to TeaBuddy ticket #2156. 
- **CoreBluetooth Authorization:** `CBManagerAuthorization` must be fully resolved *before* a QR deep link is allowed to trigger a Generic Attribute Profile (GATT) connection.
- **Background Execution:** The background steep timer requires proper `UIBackgroundTask` renewal to prevent the `TB-background-kill` bug.
- **Action Items:** 
  - Ship version 0.9.3 fix for TeaBuddy.
  - Document the permission ordering requirement in the Android kickoff to avoid repeating the same architectural mistake cross-platform.

## Related Entities
- **TeaBuddy:** Consumer application affected by the iOS 18 CoreBluetooth pairing permission changes (Ticket #2156, bug `TB-background-kill`).
- **[Nova Widget](./nova-widget.md):** Internal project utilizing UART provisioning rather than consumer QR flows, resulting in minimal relevance to the iOS 18 QR pairing bug.
- **Sam Rivera:** Author of the research notes and contributor from TeaBuddy.

## Related Concepts
- **CoreBluetooth (`CBManagerAuthorization`):** The iOS framework and authorization state mechanism required for managing [Bluetooth Low Energy](./bluetooth-low-energy.md) peripherals.
- **Background Tasks (`UIBackgroundTask`):** iOS background task management systems used to keep operations like steep timers alive during app state transitions.
- **GATT Connect / QR Deep Linking:** Consumer onboarding flows where scanning a QR code immediately triggers a Bluetooth connection attempt.

## Contradictions
*(No contradictions present in the current source materials.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

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
last_updated: "2026-09-02T06:38:51.671668+00:00"
sidebar_label: Bluetooth Low Energy
slug: /bluetooth-low-energy
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bluetooth Low Energy

## Overview

Bluetooth Low Energy ([BLE](./ble.md)) integration and pairing behavior underwent notable changes in iOS 18 beta, impacting consumer-facing applications such as [TeaBuddy](./teabuddy.md) (ticket #2156). These changes altered permission prompt ordering, requiring careful handling of authorization states and background tasks to prevent application crashes and connection failures.

## Key Details

- **Permission Prompt Ordering:** In iOS 18 beta, the permission prompt order changed. Specifically, `CBManagerAuthorization` must now fully resolve before a QR deep link is allowed to trigger a GATT connection. Failing to account for this sequence results in connection and flow failures.
- **Background Task Management:** Background steep timers require `UIBackgroundTask` renewal to avoid unexpected process terminations, which directly addressed the `TB-background-kill` bug in the TeaBuddy application.
- **Release and [Documentation](./documentation.md) Actions:** Fixes for these iOS 18 behaviors were scheduled for release in version 0.9.3, with an action item to document the findings during the Android kickoff phase to prevent repeating the same sequencing errors.

## Related Entities

- **TeaBuddy:** A consumer application (associated with author Sam Rivera) affected by iOS 18 BLE pairing changes (ticket #2156, `TB-background-kill` bug).
- **[Nova Widget](./nova-widget.md):** An internal project with minimal relevance to these specific iOS consumer QR pairing changes, as it utilizes UART provisioning instead.
- **Sam Rivera:** TeaBuddy author and researcher who documented the iOS 18 CoreBluetooth pairing findings.

## Related Concepts

- **CoreBluetooth:** Apple's framework for interacting with Bluetooth Low Energy devices, governed by authorization states like `CBManagerAuthorization`.
- **GATT Connect:** The Generic Attribute Profile connection phase initiated after device discovery and deep linking.
- **Background Tasks:** Mechanism (`UIBackgroundTask`) used to keep application logic (such as steep timers) alive while running in the background on iOS.
- **QR Deep Link:** A mechanism used in consumer apps to trigger device pairing via scanned codes.
- **UART Provisioning:** An alternative provisioning method used by Nova Widget, distinct from consumer QR flows.

## Contradictions

*(No contradictions present in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

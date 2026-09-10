---
id: ios
title: iOS
tags:
  - aurora-labs
  - background-task-renewal
  - corebluetooth-pairing-changes
  - ios
  - nova-widget
  - sam-rivera
  - teabuddy
  - wiki
last_updated: "2026-09-10T14:38:50.395478+00:00"
sidebar_label: iOS
slug: /ios
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# iOS

## Overview
Research and findings regarding iOS behaviors, specifically focusing on iOS 18 CoreBluetooth pairing changes, permission prompts, and background task management as documented by Sam Rivera ([TeaBuddy](./teabuddy.md)).

## Key Details
- **CoreBluetooth Pairing Changes (iOS 18 Beta):** Changes to the permission prompt order in iOS 18 introduced issues (referenced in TeaBuddy ticket #2156).
- **Authorization Requirement:** `CBManagerAuthorization` must be fully resolved before any QR deep link triggers a GATT connection.
- **Background Tasks:** The background steep timer requires `UIBackgroundTask` renewal to prevent the TB-background-kill bug.
- **Action Items:** 
  - Ship version 0.9.3 fix.
  - Document the permission ordering requirement in the Android kickoff to avoid repeating the same mistake.

## Related Entities
- **Sam Rivera** (Author / TeaBuddy)
- **TeaBuddy** (Product experiencing ticket #2156 and background-kill issues)
- **[Aurora Labs](./aurora-labs.md)** (Company context)
- **[Nova Widget](./nova-widget.md)** (Product utilizing UART provisioning)

## Related Concepts
- **CoreBluetooth (`CBManagerAuthorization`)**
- **[BLE](./ble.md) Pairing**
- **Background Task Renewal (`UIBackgroundTask`)**
- **QR Deep Link & GATT Connection Flow**

## Contradictions
*(No direct contradictions present in the current source corpus.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md` | text | Unverified |

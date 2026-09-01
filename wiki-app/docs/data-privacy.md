---
id: data-privacy
title: Data Privacy
tags:
  - aurora-nova-widget
  - beta-tester-confidentiality
  - data-privacy
  - endorsement-restrictions
  - hardware-safety-rating
  - meshsync
  - sensenode
  - teabuddy
last_updated: "2026-09-01T19:18:24.156578+00:00"
sidebar_label: Data Privacy
slug: /data-privacy
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Data Privacy

## Overview
Data privacy practices and [confidentiality](./confidentiality.md) guidelines for [beta testing](./beta-testing.md) initiatives, specifically governing telemetry handling, local data storage, and optional user-configured data exports for the [Aurora Nova Widget](./aurora-nova-widget.md) ecosystem.

## Key Details
- **Telemetry Handling:** Telemetry data remains stored locally on the device by default.
- **Data Export:** [MQTT Export](./mqtt-export.md) functionality is optional and must be explicitly configured by the user.
- **Beta Tester Confidentiality:** Under Section 4 of the beta tester agreement, beta [Firmware](./firmware.md), partial MeshSync source code, and [Power Budget](./power-budget.md) spreadsheets are classified as strictly confidential.
- **[Hardware Safety](./hardware-safety.md) & Limitations:** The device carries an IP54 splash-resistant rating and must not be submerged. Outdoor burial (similar to [SenseNode SN-400](./sensenode-sn-400.md)-style deployment) is not supported.
- **Endorsement Restrictions:** Beta testers are permitted to mention products like [TeaBuddy](./teabuddy.md), but such mentions must not imply an official Aurora partnership.

## Related Entities
- **Aurora Nova Widget:** The primary hardware device and widget platform subject to the beta tester agreement.
- **TeaBuddy:** A related product that beta testers are allowed to mention under specific endorsement guidelines.
- **SenseNode:** Reference benchmark for outdoor burial capabilities (which are explicitly unsupported by the Aurora Nova Widget).

## Related Concepts
- **MeshSync:** Proprietary syncing protocol/source code subject to confidentiality clauses during beta testing.
- **MQTT Export:** User-configured protocol used for optional telemetry data transmission.
- **Telemetry:** System performance and usage data that defaults to local storage for privacy preservation.

## Contradictions
*No contradictions found in the current source material.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/legal/[SAMPLE]-2026-07-04-beta-tester-agreement-snippet.txt` | text | Unverified |

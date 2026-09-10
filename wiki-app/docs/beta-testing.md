---
id: beta-testing
title: Beta Testing
tags:
  - aurora-labs
  - aurora-nova-widget
  - beta-tester-composition
  - beta-testing
  - confidentiality-agreement
  - default-read-interval
  - device-safety-and-water-resistance
  - firmware-039
last_updated: "2026-09-10T14:37:24.221900+00:00"
sidebar_label: Beta Testing
slug: /beta-testing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Beta Testing

## Overview
The beta [testing](./testing.md) program for the [Aurora Nova Widget](./aurora-nova-widget.md) managed by [Aurora Labs](./aurora-labs.md) involves a select group of testers evaluating early [hardware](./hardware.md), [firmware](./firmware.md) builds, and [documentation](./documentation.md). The program emphasizes iterative [firmware updates](./firmware-updates.md), mesh network performance, [confidentiality](./confidentiality.md), and [hardware safety](./hardware-safety.md) limitations.

## Key Details
- **Tester Composition:** The beta program consists of 12 testers, comprising 3 farmers and 9 hobbyists.
- **Hardware & Power:**
  - The beta unit uses a CR2032 battery (correcting earlier references to a CR2450 battery).
  -
  &gt; **Contradiction:**
- **Firmware & Releases:**
  - Firmware build 0.3.8 and build 0.3.9 (candidate for batch 4 retest) have been distributed. Build 0.3.9 specifically addresses the [MeshSync](./meshsync.md) relay [battery drain](./battery-drain.md) issue reported under ticket [MESH-118](./mesh-118.md).
  - Testers are instructed to flash the latest firmware before adding more than 6 nodes to a mesh network.
- **Device Safety & Water Resistance:** Devices feature an IP54 splash-resistant rating only and must not be submerged. [SenseNode](./sensenode.md)-style outdoor burial is not supported.
- **Confidentiality & [Legal](./legal.md):** Under the beta agreement, beta firmware, partial MeshSync sources, and [power budget](./power-budget.md) spreadsheets are classified as confidential. Telemetry data remains local unless an optional [MQTT export](./mqtt-export.md) is configured by the user.

## Related Entities
- [Aurora Labs](aurora-labs) — The organization managing the beta program and developing the Nova Widget.
- [Aurora Nova Widget](aurora-nova-widget) — The primary hardware device undergoing beta testing.
- [MeshSync](meshsync) — The underlying mesh protocol and synchronization framework, associated with GitHub issue #442 and ticket MESH-118.

## Related Concepts
- [Firmware Updates](firmware-updates) — The process of flashing builds such as 0.3.8 and 0.3.9 to resolve battery drain and stability bugs.
- [Device Safety and Water Resistance](device-safety-and-water-resistance) — Guidelines regarding the IP54 splash-resistant constraints of the beta hardware.
- [Default Read Interval](default-read-interval) — The timing [configuration](./configuration.md) for device telemetry collection.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/2026-06-08-meeting-no-agenda.txt` | text | Medium |
| 2 | `notes/ideas/emails/2026-06-10-nova-widget-beta-invite.eml` | email | Medium |
| 3 | `samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt` | text | Unverified |
| 4 | `samples/legal/[SAMPLE]-2026-07-04-beta-tester-agreement-snippet.txt` | text | Unverified |

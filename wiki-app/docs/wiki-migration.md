---
id: wiki-migration
title: Wiki Migration
tags:
  - battery-specifications
  - default-read-interval
  - meshsync
  - nova-widget
  - sam-rivera
  - sensenode
  - teabuddy
  - wiki
last_updated: "2026-09-01T21:26:12.860084+00:00"
sidebar_label: Wiki Migration
slug: /wiki-migration
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wiki Migration

## Overview
This wiki page documents the recovery and migration notes originating from a broken Notion markdown export dated 2026-06-17. It captures specifications, architectural decisions, and cross-references regarding [hardware](./hardware.md) devices and software [protocols](./protocols.md) such as [Nova Widget](./nova-widget.md), [TeaBuddy](./teabuddy.md), and SenseNode.

## Key Details
- **Nova Widget Protocol:** Uses [MeshSync](./meshsync.md) as its mesh protocol.
- **Default Read Interval:** Configured to 15 minutes.
- **Nova Widget Power Specifications:**
  - Battery type: CR2032 (some [documentation](./documentation.md) incorrectly references CR2450).
  - Sleep current: 4.2 µA.
  - Transmission (TX) current: 12 mA.
- **TeaBuddy Connectivity:** Relies on [BLE](./ble.md) ([Bluetooth Low Energy](./bluetooth-low-energy.md)) rather than a mesh network.
- **SenseNode Casing:** Built with an IP67 rating, offering superior [waterproofing](./waterproofing.md).

## Related Entities
- **Nova Widget:** The primary [IoT](./iot.md) device tracked in these notes, utilizing MeshSync and CR2032 batteries.
- **TeaBuddy:** A separate product/codebase utilizing BLE.
- **SenseNode:** A hardware node noted for its IP67 waterproof rating.
- **Sam Rivera:** Team member/lead who advised against merging codebases between Nova Widget and TeaBuddy.

## Related Concepts
- **[Mesh Networking](./mesh-networking.md):** Implemented via MeshSync for Nova Widget, contrasted with TeaBuddy's direct BLE implementation.
- **[Hardware Power Management](./hardware-power-management.md):** Sleep and TX power draw specifications for low-power sensor nodes.

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the Nova Widget battery type. While current specifications and correct documentation specify a CR2032 battery, older documentation incorrectly states that the device uses a CR2450. Additionally, the default read interval was initially noted as hourly during [project kickoff](./project-kickoff.md), but is currently set to 15 minutes.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md` | text | Unverified |

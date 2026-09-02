---
id: hardware-safety
title: Hardware Safety
tags:
  - aurora-nova-widget
  - beta-tester-confidentiality
  - endorsement-restrictions
  - hardware-safety
  - hardware-safety-rating
  - meshsync
  - sensenode
  - teabuddy
last_updated: "2026-09-02T06:39:54.758666+00:00"
sidebar_label: Hardware Safety
slug: /hardware-safety
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Safety

## Overview
The **[Hardware](./hardware.md) Safety** guidelines outline the physical limitations, environmental ratings, and operational constraints for beta hardware testing, specifically concerning the [Aurora Nova Widget](./aurora-nova-widget.md). These [protocols](./protocols.md) ensure safe usage and prevent device damage during the [beta testing](./beta-testing.md) phase.

## Key Details
- **Ingress Protection:** The Aurora Nova Widget holds an IP54 splash-resistant rating. 
- **Submersion Warning:** The device must not be submerged in water under any circumstances.
- **Outdoor Limitations:** [SenseNode SN-400](./sensenode-sn-400.md)-style outdoor burial or deep outdoor placement is explicitly not supported by the [hardware design](./hardware-design.md).
- **[Confidentiality](./confidentiality.md) Scope:** Associated hardware [documentation](./documentation.md), including [power budget](./power-budget.md) spreadsheets, beta [firmware](./firmware.md), and [MeshSync](./meshsync.md) source partials, are bound by strict confidentiality terms.
- **Telemetry & Data:** Telemetry data remains stored locally by default, with optional [MQTT Export](./mqtt-export.md) available via user configuration.

## Related Entities
- **Aurora Nova Widget:** The primary beta hardware device governed by these safety and confidentiality agreements.
- **SenseNode:** Referenced as an incompatible deployment method (outdoor burial style).
- **[TeaBuddy](./teabuddy.md):** Mentioned in the context of beta tester product mentions and endorsement restrictions.

## Related Concepts
- **Hardware Safety Rating:** The classification of device durability against environmental factors, such as the IP54 rating.
- **Beta Tester Confidentiality:** [Legal](./legal.md) and operational boundaries regarding unreleased firmware, source code, and internal power specifications.
- **Endorsement Restrictions:** Rules dictating that beta testers may mention other products like TeaBuddy without implying an official Aurora partnership.

## Contradictions
*(No direct contradictions present in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/legal/[SAMPLE]-2026-07-04-beta-tester-agreement-snippet.txt` | text | Unverified |

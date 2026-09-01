---
id: mechanical-design
title: Mechanical Design
tags:
  - ip54-splash-resistance
  - jonah
  - mechanical-design
  - meshsync
  - nova-widget
  - wiki
last_updated: "2026-09-01T21:23:58.657350+00:00"
sidebar_label: Mechanical Design
slug: /mechanical-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Mechanical Design

## Overview
The mechanical design specifications outline the structural and physical enclosure requirements for the [Nova Widget](./nova-widget.md) [hardware](./hardware.md) revision C. The design focuses on a pebble-shaped housing built with rapid prototyping materials and weather-sealing considerations.

## Key Details
- **Enclosure:** Constructed from PETG beta material, featuring a pebble shape designed by Jonah.
- **Gasketing & Sealing:** Utilizes a silicone 50A gasket, providing IP54 splash resistance.
- **Tooled Variants:** A fully tooled IP65 variant was considered but ultimately deferred due to a $7,850 cost quote.
- **Battery Compartment Integration:** Incorporates a CR2032 battery holder (revision C) specifically engineered to fix battery rattle issues. *(Note: Previous misprints referencing the CR2450 led to ticket #2201, and printing instructions explicitly forbid it).*

## Related Entities
- **Jonah:** The designer responsible for the pebble-shaped enclosure.
- **Nova Widget:** The hardware device (Revision C) implementing these mechanical specifications.

## Related Concepts
- **IP54 Splash Resistance:** The ingress protection rating achieved via the silicone 50A gasket.
- **[MeshSync](./meshsync.md):** The [firmware](./firmware.md) baseline running on the device (version 0.3.8 with a 15-minute default interval).
- **Capacitive Soil Probe:** The 30mm internal/external sensor probe integrated into the device hardware.

## Contradictions
*(No contradictions present in the current specification baseline.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md` | text | Unverified |

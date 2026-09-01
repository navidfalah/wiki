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
last_updated: "2026-09-01T19:19:49.676967+00:00"
sidebar_label: Mechanical Design
slug: /mechanical-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Mechanical Design

## Overview
Mechanical design specifications for [hardware](./hardware.md) revision C of the [Nova Widget](./nova-widget.md) outline the physical enclosure, sealing mechanisms, and structural considerations for production. The design emphasizes splash resistance and addresses previous hardware feedback such as battery rattle.

## Key Details
- **Enclosure:** Constructed from PETG beta material featuring a pebble shape, designed by Jonah.
- **Gasket:** Utilizes a silicone 50A gasket providing IP54 splash resistance.
- **Variants:** An IP65 tooled variant was evaluated but ultimately deferred following a $7,850 cost quote.
- **Battery Compartment:** The CR2032 battery holder (revision C) specifically incorporates fixes to eliminate battery rattle observed in previous iterations.
- **Labels:** Strict instructions dictate that "CR2450" must NOT be printed, preventing a recurrence of the misprint that triggered ticket #2201.

## Related Entities
- **Jonah:** The designer responsible for the pebble-shaped PETG beta enclosure.
- **Nova Widget:** The primary hardware device utilizing these mechanical and electrical specifications (hardware revision C).

## Related Concepts
- **IP54 Splash Resistance:** The ingress protection rating achieved via the silicone 50A gasket.
- **MeshSync:** The [firmware](./firmware.md) baseline running version 0.3.8 with a 15-minute default interval.
- **Capacitive Soil Probe:** A 30mm electrical component integrated alongside the hardware assembly.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md` | text | Unverified |

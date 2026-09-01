---
id: firmware
title: Firmware
tags:
  - firmware
  - ip54-splash-resistance
  - jonah
  - meshsync
  - nova-widget
  - wiki
last_updated: "2026-09-01T19:18:46.960628+00:00"
sidebar_label: Firmware
slug: /firmware
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware

## Overview

This page details specifications and requirements associated with the [Nova Widget](./nova-widget.md) [hardware](./hardware.md) revision C, with a specific focus on its [firmware](./firmware.md) baseline, [mechanical design](./mechanical-design.md), and electrical components.

## Key Details

- **Firmware Baseline:** MeshSync 0.3.8 operating on a 15-minute default interval.
- **Mechanical Enclosure:** PETG beta, pebble shape (designated as Jonah).
- **Gasket and Water Resistance:** Silicone 50A gasket providing IP54 splash resistance (an IP65 tooled variant was deferred following a $7,850 quote).
- **Electrical Components:** Powered by an nRF52840 MCU and a CR2032 [battery](./battery-life.md) with a revision C holder designed to fix previous rattling issues. It also includes a 30mm capacitive [soil probes](./soil-probes.md).
- **Labeling Instructions:** Explicitly prohibits printing CR2450 to prevent a recurrence of ticket #2201 caused by a previous misprint.

## Related Entities

- **Jonah:** Code name or design reference for the pebble-shaped PETG beta enclosure.
- **MeshSync:** The [firmware architecture](./firmware-architecture.md) protocol/system utilized at baseline version 0.3.8.
- **Nova Widget:** The hardware device (Revision C) utilizing these specifications.

## Related Concepts

- **IP54 Splash Resistance:** The ingress protection rating provided by the silicone 50A gasket.
- **Capacitive Soil Probing:** The sensing mechanism utilizing a 30mm length probe.
- **[Battery Management](./battery-management.md):** The use of a CR2032 cell with a revised holder to secure the battery and eliminate rattling.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md` | text | Unverified |

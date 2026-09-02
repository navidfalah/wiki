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
last_updated: "2026-09-02T06:39:34.310652+00:00"
sidebar_label: Firmware
slug: /firmware
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware

## Overview
This document outlines the firmware baseline and related [Hardware Specifications](./hardware-specifications.md) for the [Nova Widget](./nova-widget.md) (Hardware Revision C), detailing its operational intervals, underlying software versions, and system architecture parameters.

## Key Details
- **Firmware Baseline:** [MeshSync](./meshsync.md) version 0.3.8
- **Default Interval:** 15 minutes
- **Hardware Integration:** Designed for the Nova Widget Revision C featuring an nRF52840 MCU, a pebble-shaped PETG beta enclosure (codenamed Jonah), a silicone 50A gasket providing IP54 splash resistance, and a CR2032 battery holder.

## Related Entities
- **MeshSync:** The protocol/software suite utilized for the baseline firmware (version 0.3.8).
- **Nova Widget:** The target device running the firmware (Revision C).
- **Jonah:** Codenamed pebble-shaped PETG beta enclosure for the device.

## Related Concepts
- **Splash Resistance:** IP54 protection enabled by the silicone 50A gasket, operating alongside the firmware scheduling.
- **Polling Intervals:** The default 15-minute operational interval managed by the firmware baseline for sensor readings (such as the 30mm capacitive soil probe).

## Contradictions
*(No contradictions present in the current data source.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md` | text | Unverified |

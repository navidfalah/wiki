---
id: electrical-design
title: Electrical Design
tags:
  - electrical-design
  - ip54-splash-resistance
  - jonah
  - meshsync
  - nova-widget
  - wiki
last_updated: "2026-09-02T06:39:16.522063+00:00"
sidebar_label: Electrical Design
slug: /electrical-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Electrical Design

## Overview
This wiki page outlines the electrical design specifications and related [hardware](./hardware.md) configurations for the [Nova Widget](./nova-widget.md) hardware revision C, detailing components such as the microcontroller, power source, and probe design.

## Key Details
- **MCU:** nRF52840
- **Battery:** CR2032 holder (revision C includes a fix for the battery rattle issue)
- **Probe:** Capacitive soil probe with a 30mm length
- **Enclosure & Protection:** Pebble-shaped PETG beta enclosure designed by Jonah, featuring a silicone 50A gasket providing IP54 splash resistance (the IP65 tooled variant was deferred following a $7,850 quote)
- **Labeling Constraints:** Do NOT print CR2450 labels, as a previous misprint caused ticket #2201
- **[Firmware](./firmware.md) Baseline:** [MeshSync](./meshsync.md) 0.3.8 with a 15-minute default interval

## Related Entities
- **Jonah:** Enclosure designer for the PETG beta pebble-shaped casing
- **Nova Widget:** The hardware device (Revision C) utilizing these electrical and mechanical specs

## Related Concepts
- **IP54 Splash Resistance:** Provided by the silicone 50A gasket
- **MeshSync:** Firmware protocol baseline operating at version 0.3.8
- **Capacitive Soil Sensing:** Implemented via the 30mm probe length

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md` | text | Unverified |

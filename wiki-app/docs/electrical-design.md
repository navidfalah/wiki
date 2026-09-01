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
last_updated: "2026-09-01T21:22:37.907919+00:00"
sidebar_label: Electrical Design
slug: /electrical-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Electrical Design

## Overview
This document outlines the electrical and [Hardware Specifications](./hardware-specifications.md) for the [Nova Widget](./nova-widget.md) (hardware revision C), capturing details regarding component selection, power sources, sensing probes, and related mechanical and [Firmware](./firmware.md) configurations.

## Key Details
- **Microcontroller Unit (MCU):** Powered by the nRF52840.
- **Battery:** Utilizes a CR2032 battery with a rev C holder designed to fix previous rattling issues. (Note: Labels must not print CR2450, avoiding a repeat of the misprint that caused ticket #2201).
- **Probe:** Features a capacitive soil probe with a 30mm length.
- **Enclosure & Mechanical Context:** Housed in a PETG beta pebble shape enclosure designed by Jonah, featuring a silicone 50A gasket providing IP54 splash resistance. A more robust IP65 tooled variant was deferred based on a $7,850 quote.
- **Firmware Baseline:** Operates on [MeshSync](./meshsync.md) 0.3.8 with a 15-minute default interval.

## Related Entities
- **Jonah:** Designer of the pebble-shaped PETG beta enclosure.
- **MeshSync:** Firmware baseline running version 0.3.8.
- **Nova Widget:** The hardware product (revision C) incorporating these electrical and mechanical specifications.

## Related Concepts
- **IP54 Splash Resistance:** Achieved via the silicone 50A gasket sealing the enclosure.
- **Capacitive Soil Sensing:** Utilized via a 30mm probe connected to the hardware.
- **[Battery Management](./battery-management.md):** CR2032 power configuration with physical holder refinements to eliminate rattling.

## Contradictions
*(No contradictions present in the provided sources.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md` | text | Unverified |

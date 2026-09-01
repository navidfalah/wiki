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
last_updated: "2026-09-01T19:18:28.629701+00:00"
sidebar_label: Electrical Design
slug: /electrical-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Electrical Design

## Overview
This wiki page outlines the electrical design specifications and [hardware](./hardware.md) revisions for the [Nova Widget](./nova-widget.md) project, detailing its microcontrollers, power sources, sensing probes, and [firmware](./firmware.md) baseline.

## Key Details
- **MCU**: nRF52840
- **Battery**: CR2032 holder rev C, which resolves the battery rattle issue present in earlier iterations.
- **Labels**: Strict instruction to NOT print CR2450, avoiding a recurrence of ticket #2201 caused by a previous misprint.
- **Probe**: Capacitive soil probe with a 30mm length.
- **Enclosure & Mechanical Integration**: Features a PETG beta pebble-shaped enclosure designed by Jonah, complete with a silicone 50A gasket providing IP54 splash resistance. An IP65 tooled variant was deferred following a $7,850 quote.
- **Firmware Baseline**: MeshSync 0.3.8 operating on a 15-minute default interval.

## Related Entities
- Nova Widget
- Jonah

## Related Concepts
- CR2032
- IP54 splash resistance
- MeshSync
- Capacitive soil probing

## Contradictions
*(No contradictions present in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md` | text | Unverified |

---
id: debugging
title: Debugging
tags:
  - debugging
  - jonah
  - mira
  - nrf52840
  - nrf5340
  - parent-swap
  - rejoin-storm
  - teabuddy
last_updated: "2026-09-02T06:39:13.464305+00:00"
sidebar_label: Debugging
slug: /debugging
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Debugging

## Overview
This page captures debugging insights, notes, and action items from engineering sessions regarding mesh synchronization issues. Specifically, it documents findings from a joint debugging session between [Mira](./aurora-nova-widget-v2.md) and Jonah on June 12, focusing on network rejoin storms, current consumption spikes during parent swaps, and [hardware](./hardware.md) comparisons for upcoming revisions.

## Key Details
- **Rejoin Storms:** Rejoin storms continue to reproduce consistently at an 8-node network scale.
- **[Power Consumption](./power-consumption.md):** A noticeable power spike occurs during a parent swap, rising from 110 µA up to 340 µA.
- **Diverging Perspectives:** 
  - Mira considers the current behavior "fine for beta."
  - Jonah emphasizes the need for better observability, suggesting logging every rejoin event along with its RSSI and hop count.
- **Whiteboard Notes:** A whiteboard capture from the session, though largely illegible, highlights a fundamental design question: *"PARENT? CHILD? WHO DECIDES???"*
- **Action Items:**
  - Capture a 24-hour trace on the staging mesh.
  - Compare the nRF52840 and nRF5340 microcontrollers for the next hardware revision.
  - Create a wiki page titled "known mesh quirks v0.3."
- **Side Projects:** The [TeaBuddy](./teabuddy.md) team inquired about using the mesh network to sync tea timers across a house, which Mira immediately vetoed for version 1 ("absolutely not v1").

## Related Entities
- **Mira**
- **Jonah**
- **Teabuddy Team**
- **nRF52840**
- **nRF5340**

## Related Concepts
- **[MeshSync](./meshsync.md)**
- **Rejoin Storms**
- **Parent Swaps**
- **RSSI & Hop Count Logging**
- **Hardware Revision Evaluation**

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt` | text | Unverified |

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
last_updated: "2026-09-01T21:22:34.816966+00:00"
sidebar_label: Debugging
slug: /debugging
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Debugging

## Overview
This page documents the debugging efforts, technical notes, and collaborative [troubleshooting](./troubleshooting.md) sessions conducted by the engineering team (notably [Mira](./nova-widget.md) and Jonah) regarding mesh network synchronization, [power consumption](./power-consumption.md) anomalies, and [hardware](./hardware.md) revisions.

## Key Details
- **Rejoin Storms:** Testing with an 8-node mesh network continues to reproduce rejoin storms, specifically noting a current spike from 110 µA to 340 µA during a parent swap.
- **Team Stances:** 
  - Mira considers the current behavior "fine for beta" and ruled out expanding the mesh for use cases like syncing tea timers across a house for the "[Teabuddy](./teabuddy.md)" team ("absolutely not v1").
  - Jonah requested logging improvements, specifically to log every rejoin event along with its RSSI and hop count.
- **Whiteboard Notes:** A whiteboard capture from the session highlights core architectural questions regarding network hierarchy: *"PARENT? CHILD? WHO DECIDES???"*
- **Action Items:**
  - Capture a 24-hour trace on the staging mesh.
  - Compare the nRF52840 and nRF5340 microcontrollers for the next hardware revision.
  - Create a wiki page titled "known mesh quirks v0.3".

## Related Entities
- **Mira:** Engineering team member who views current mesh performance as acceptable for beta and dismisses out-of-scope feature requests.
- **Jonah:** Engineering team member focused on detailed logging and diagnostics (RSSI and hop counts during rejoins).
- **Teabuddy Team:** Internal team that inquired about syncing tea timers across a house using the mesh network.

## Related Concepts
- **[MeshSync](./meshsync.md):** The underlying mesh synchronization system being debugged.
- **Parent Swap & Rejoin Storms:** Network dynamics involving node re-attachments, causing measurable power consumption spikes (110 µA to 340 µA).
- **[Hardware Evaluation](./hardware-evaluation.md):** Comparing nRF52840 and nRF5340 chipsets for future hardware revisions.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt` | text | Unverified |

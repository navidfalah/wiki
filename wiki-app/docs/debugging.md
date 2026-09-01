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
last_updated: "2026-09-01T19:18:25.791815+00:00"
sidebar_label: Debugging
slug: /debugging
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Debugging

## Overview
This wiki page documents [troubleshooting](./troubleshooting.md) efforts, observations, and action items from the MeshSync debug sessions conducted by Mira and Jonah on June 12.

## Key Details
- **Rejoin Storms:** A rejoin storm at an 8-node scale continues to reliably reproduce.
- **[Power Consumption](./power-consumption.md):** A current spike from 110 µA to 340 µA occurs during a parent swap.
- **Team Perspectives:**
  - **Mira:** Considers the current behavior "fine for beta." Rejected a request from the [TeaBuddy](./teabuddy.md) team to sync tea timers across the house for v1 ("absolutely not v1").
  - **Jonah:** Recommends logging every rejoin alongside RSSI and hop count data.
- **Whiteboard Notes:** Included an exasperated philosophical query regarding topology decisions: *"PARENT? CHILD? WHO DECIDES???"*
- **Action Items:**
  - Capture a 24-hour trace on the staging mesh.
  - Compare the nRF52840 and nRF5340 microcontrollers for the next [hardware](./hardware.md) revision.
  - Create a wiki page titled "known mesh quirks v0.3".

## Related Entities
- **Mira**
- **Jonah**
- **Teabuddy team**

## Related Concepts
- **MeshSync**
- **Parent-swap**
- **Rejoin storm**
- **nRF52840**
- **nRF5340**

## Contradictions
*(No contradictions present in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt` | text | Unverified |

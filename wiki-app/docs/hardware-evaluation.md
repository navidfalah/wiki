---
id: hardware-evaluation
title: Hardware Evaluation
tags:
  - hardware-evaluation
  - jonah
  - mira
  - nrf52840
  - nrf5340
  - parent-swap
  - rejoin-storm
  - teabuddy
last_updated: "2026-09-01T19:18:58.836684+00:00"
sidebar_label: Hardware Evaluation
slug: /hardware-evaluation
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Evaluation

## Overview
During a MeshSync debug session on June 12 by [Mira](./aurora-labs.md) and Jonah, [hardware](./hardware.md) evaluation tasks were discussed alongside ongoing mesh stability investigations. A central action item emerged to compare microcontroller options for the next hardware revision, specifically evaluating the nRF52840 against the nRF5340.

## Key Details
- **Next-Rev Comparison:** The team highlighted the need to compare the `nRF52840` vs `nRF5340` microcontrollers for the next hardware iteration.
- **Power and Performance Context:** Current mesh [debugging](./debugging.md) noted a rejoin storm at 8 nodes, which causes a current spike from 110µA to 340µA during a parent swap. While Mira deemed this behavior "fine for beta," power profiling and hardware capabilities remain critical considerations for future revisions.

## Related Entities
- **Mira:** Engineering team member who considers current beta performance acceptable and oversees feature scope (e.g., rejecting the [TeaBuddy](./teabuddy.md) integration for v1).
- **Jonah:** Engineering team member who requested detailed logging of every rejoin with RSSI and hop count.
- **Teabuddy Team:** Internal group that inquired about syncing tea timers across a house using the mesh network.

## Related Concepts
- **Rejoin Storm:** A network event occurring at 8 nodes that triggers significant current spikes (110µA to 340µA) during parent swaps.
- **MeshSync:** The underlying mesh synchronization protocol being debugged.

## Contradictions
*No contradictions were identified in the source material for this topic.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt` | text | Unverified |

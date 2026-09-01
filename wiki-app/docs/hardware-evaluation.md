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
last_updated: "2026-09-01T21:23:06.696480+00:00"
sidebar_label: Hardware Evaluation
slug: /hardware-evaluation
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Evaluation

## Overview
This page captures [hardware](./hardware.md) evaluation notes and insights stemming from [MeshSync](./meshsync.md) debug sessions and team discussions involving [Nova Widget](./nova-widget.md) and Jonah. A primary focus is assessing microcontrollers like the nRF52840 and nRF5340 for future hardware revisions in light of ongoing network performance observations such as rejoin storms and parent-swap current spikes.

## Key Details
- **Microcontroller Comparison:** The team has proposed comparing the `nRF52840` versus the `nRF5340` to determine suitability for the next hardware revision.
- **Rejoin Storms & Power Spikes:** Rejoin storms continue to reproduce consistently at 8 nodes. Specifically, a parent swap triggers a current spike from 110 µA up to 340 µA.
- **[Debugging](./debugging.md) & Telemetry:** Jonah suggested logging every rejoin event along with RSSI and hop count metrics, while Mira considers the current behavior acceptable ("fine for beta").
- **Whiteboard Notes:** A whiteboard capture from the session noted the open design question: *"PARENT? CHILD? WHO DECIDES???"*

## Related Entities
- **Jonah:** Engineering team member advocating for detailed telemetry (logging rejoins with RSSI and hop count) and hardware evaluation.
- **Mira:** Engineering team member who considers current beta performance acceptable and ruled out external feature requests like tea timer synchronization for v1.
- **[TeaBuddy](./teabuddy.md) Team:** Internal or adjacent group that inquired about synchronizing tea timers across a house using the mesh network.

## Related Concepts
- **Rejoin Storm:** A network phenomenon occurring at 8 nodes where devices repeatedly attempt to rejoin the mesh.
- **Parent Swap:** The transition of a node from one parent router to another, observed to cause a power draw spike from 110 µA to 340 µA.
- **MeshSync:** The underlying mesh synchronization protocol and debugging focus.

## Contradictions
*There are no direct contradictions present in the current evaluation notes.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt` | text | Unverified |

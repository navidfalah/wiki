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
last_updated: "2026-09-02T06:39:45.536046+00:00"
sidebar_label: Hardware Evaluation
slug: /hardware-evaluation
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Evaluation

## Overview
This page documents [hardware](./hardware.md) evaluation efforts and related [firmware](./firmware.md)/mesh [debugging](./debugging.md) discussions between team members [Mira](./aurora-nova-widget-v2.md) and Jonah, originating from a [MeshSync](./meshsync.md) debug session on June 12. Topics include current power draw during mesh operations, plans for future revision hardware, and unrelated feature inquiries.

## Key Details
- **Rejoin Storms:** Rejoin storms continue to reproduce at a scale of 8 nodes. A parent swap triggers a current spike from 110 µA up to 340 µA.
- **Logging Improvements:** Jonah requested that every rejoin be logged along with its RSSI and hop count.
- **Hardware Comparison:** An action item was established to compare the nRF52840 and nRF5340 microcontrollers for the next hardware revision.
- **Power and Performance Stance:** Mira evaluated the current parent swap power spike as "fine for beta."
- **[TeaBuddy](./teabuddy.md) Inquiry:** The teabuddy team inquired about using the mesh network to synchronize tea timers across a house, which Mira firmly rejected for v1 ("absolutely not v1").

## Related Entities
- **Jonah:** Team member advocating for granular logging (RSSI + hop count on rejoins) and future hardware comparisons.
- **Mira:** Team member overseeing project scope and staging acceptance, deeming the beta power spikes acceptable and rejecting out-of-scope features like house-wide tea timer synchronization.
- **Teabuddy Team:** Internal team that proposed an unapproved v1 use case for the mesh network.

## Related Concepts
- **Rejoin Storm:** Network stability issue occurring at 8 nodes, characterized by power spikes during parent switches.
- **Parent Swap:** Network topology event causing a current consumption spike from 110 µA to 340 µA.
- **nRF52840 / nRF5340:** Candidate chipsets under consideration for the next hardware revision.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt` | text | Unverified |

---
id: local-first-software
title: Local-First Software
tags:
  - alex-kim
  - aurora
  - ble-vs-mesh-tradeoffs
  - jonah
  - local-first-iot
  - local-first-software
  - mira
  - nova-widget
last_updated: "2026-09-01T21:23:53.394678+00:00"
sidebar_label: Local-First Software
slug: /local-first-software
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Local-First Software

## Overview
Local-first software and [hardware design](./hardware-design.md) prioritize device autonomy, local control, and the minimization or complete elimination of mandatory cloud infrastructure. This topic was the focus of a lunch-and-learn session at the [Aurora](./nova-widget.md) office featuring invited guest presenter Alex Kim from [TeaBuddy](./teabuddy.md).

## Key Details
- **Presenter:** Alex Kim (TeaBuddy, invited guest at the Aurora office)
- **Core Topics Covered:**
  - [BLE](./ble.md) ([Bluetooth Low Energy](./bluetooth-low-energy.md)) versus [mesh networking](./mesh-networking.md) tradeoffs for consumer gadgets.
  - The architectural decision behind why TeaBuddy rejected cloud accounts for version 1 (v1).
  - Live demonstrations comparing puck buzzer behaviors against [Nova Widget](./nova-widget.md) LED patterns.
- **Q&A Highlights:**
  - **[Mira](./nova-widget.md):** Noted that mesh complexity is worthwhile when scaling to 6 or more garden [sensors](./sensors.md).
  - **Alex Kim:** Emphasized that target users (tea drinkers) prefer devices with a single, dedicated job.
  - **Jonah:** Offered to share enclosure supplier contacts.
- **Action Items:** Add a cross-link wiki page for `teabuddy-cross-ref` (noting that it may already exist).

## Related Entities
- **Alex Kim:** Invited guest presenter from TeaBuddy.
- **Aurora:** Office location hosting the lunch-and-learn session.
- **TeaBuddy:** Company developing local-first consumer gadgets without cloud accounts.
- **Mira:** Participant in the Q&A discussing mesh complexity and garden sensors.
- **Jonah:** Participant in the Q&A offering supplier contacts.
- **Nova Widget:** Hardware device used in the LED pattern demonstration.

## Related Concepts
- **Local-First [IoT](./iot.md):** Designing Internet of Things devices that operate independently of cloud servers.
- **BLE vs Mesh Tradeoffs:** Evaluating the range, [power consumption](./power-consumption.md), and network topology choices for hardware communication.

## Contradictions
*(No direct contradictions reported in the source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/notes/[SAMPLE]-2026-07-05-lunch-and-learn-notes.txt` | text | Unverified |

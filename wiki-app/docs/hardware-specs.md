---
id: hardware-specs
title: Hardware Specs
tags:
  - alex
  - aurora-nova-widget
  - battery-specification
  - battery-specifications
  - cr2032-battery-capacity
  - default-read-interval
  - hardware-specs
  - ip-rating
last_updated: "2026-09-10T14:38:35.981022+00:00"
sidebar_label: Hardware Specs
slug: /hardware-specs
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Specs

## Overview
This page compiles the [hardware specifications](./hardware-specifications.md), [power budget](./power-budget.md) metrics, and component details for the [Aurora Nova Widget](./aurora-nova-widget.md), along with relevant cross-references to comparative devices such as the [TeaBuddy puck](./teabuddy.md) and [SenseNode SN-400](./sensenode-sn-400.md).

## Key Details

### Aurora Nova Widget Hardware & Power Specifications
- **Battery:** CR2032 coin cell battery (nominal 220 mAh capacity). 
- **Default Read Interval:** 15 minutes (authoritative specification).
- **Mesh Protocol:** [MeshSync](./meshsync.md).
- **Ingress Protection (IP) Rating:** IP54 (beta rating).
- **[Power Consumption](./power-consumption.md) & Current States:**
  - **Sleep State:** 4.2 µA (99.7% duty cycle, ~0.10 mAh/day).
  - **Sample + TX State:** 12 mA (0.03% duty cycle, ~0.05 mAh/day).
  - **Rejoin Spike:** 180 µA average (0.01% duty cycle, ~0.04 mAh/day).
- **Total Daily Draw & Expected Lifespan:** ~0.19 mAh/day, yielding an engineering-claimed lifespan of approximately 18 months under a stress case of 10 mesh nodes.

&gt; **Contradiction:** 
&gt; - **Battery Type:** Official design specifications and engineering notes confirm the device uses a CR2032 cell (220 mAh). However, some older [documentation](./documentation.md) and Alex's blog incorrectly reference a CR2450 battery, and early kickoff slides incorrectly listed an hourly read interval. 
&gt; - **Lifespan Claims:** While engineering models estimate an 18-month lifespan at 10 nodes based on a 15-minute read interval, [marketing](./marketing.md) slides claim "2 years," which assumes 6 nodes, an optimistic cell, and hourly reads.

## Related Entities
- **Aurora Nova Widget:** The primary device utilizing the [MeshSync protocol](./meshsync-protocol.md), CR2032 battery, and IP54 rating.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Author of the power budget working notes and participant in battery specification validations.
- **Jonah Park:** Engineering/project participant discussing [battery life](./battery-life.md) claims and stakeholder alignments.
- **Alex:** Author of a blog post containing incorrect [battery specifications](./battery-specifications.md) (referencing CR2450).
- **Sam Rivera / TeaBuddy Team:** Creators of the TeaBuddy puck (a [BLE](./ble.md)-based device with haptic draw that uses a different chemistry).
- **SenseNode (SN-400):** Outdoor-use comparative device featuring an IP67 waterproof rating.

## Related Concepts
- **MeshSync:** The underlying [mesh networking](./mesh-networking.md) protocol used by the Nova Widget.
- **Power Budget:** The calculated daily milliamp-hour (mAh) consumption accounting for sleep, sample/TX, and rejoin states.
- **Ingress Protection (IP):** Environmental sealing standards (comparing the Nova Widget's IP54 beta rating with the SenseNode's IP67 rating).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt` | text | Unverified |
| 2 | `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md` | text | Unverified |
| 3 | `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt` | text | Unverified |
| 4 | `transcripts/TEST-support-ticket.txt` | text | Medium |

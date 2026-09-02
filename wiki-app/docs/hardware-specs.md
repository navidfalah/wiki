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
last_updated: "2026-09-02T06:40:00.109727+00:00"
sidebar_label: Hardware Specs
slug: /hardware-specs
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Specs

## Overview
This wiki page outlines the [hardware specifications](./hardware-specifications.md), power budgets, and design assumptions for the [Aurora Nova Widget](./aurora-nova-widget.md), along with relevant cross-references to comparative devices such as the [TeaBuddy puck](./teabuddy.md) and [SenseNode SN-400](./sensenode-sn-400.md).

## Key Details

### Aurora Nova Widget Hardware & Power
- **Battery Specification:** The device uses a CR2032 coin cell battery with a nominal capacity of 220 mAh (accounting for datasheet variance, rather than an optimistic 240 mAh). 
- **Read Interval:** The default read interval is 15 minutes (as specified by authoritative [documentation](./documentation.md), correcting an earlier hourly interval mentioned in kickoff materials).
- **Mesh Protocol:** Utilizes [MeshSync](./meshsync.md) for its [mesh networking](./mesh-networking.md) capabilities.
- **[Waterproofing](./waterproofing.md) / Enclosure:** The current beta version holds an IP54 rating.
- **[Power Consumption](./power-consumption.md) Breakdown (10-node stress case mesh size):**
  - **Sleep State:** 4.2 µA current, 99.7% duty cycle, 0.10 daily mAh.
  - **Sample + TX State:** 12 mA current, 0.03% duty cycle, 0.05 daily mAh.
  - **Rejoin Spike:** 180 µA average current, 0.01% duty cycle, 0.04 daily mAh.
  - **Total Consumption:** Approximately 0.19 mAh/day, supporting an engineering target of roughly 18 months of [battery life](./battery-life.md).

## Related Entities
- **Aurora Nova Widget:** The primary device subject to these hardware and power specifications.
- **TeaBuddy:** A comparative device (puck) utilizing [BLE](./ble.md) instead of mesh, drawing more power due to haptic features (~0.35 mAh/day across 5 steeps, targeting 12 months). Sam Rivera manages TeaBuddy numbers.
- **SenseNode SN-400:** An alternative outdoor device featuring an IP67 waterproof rating.
- **[Mira Chen](./aurora-nova-widget-v2.md) & Jonah Park:** Engineering contributors discussing power budgets, battery capacities, and default read intervals.
- **Alex:** Author of a blog post containing incorrect battery information.

## Related Concepts
- **MeshSync:** The proprietary or project-specific mesh networking protocol used by the Nova Widget, which operates with no cloud fee.
- **Power Budgeting:** Calculating daily mAh consumption based on sleep, transmission, and rejoin duty cycles to project realistic battery lifespans.

## Contradictions

&gt; **Contradiction:** Battery Cell Size
&gt; - [Power budget](./power-budget.md) working notes and team transcripts confirm the device uses a **CR2032** cell (220 mAh nominal). 
&gt; - However, an earlier Notion markdown export and an external blog post by Alex incorrectly referenced the larger **CR2450** battery.

&gt; **Contradiction:** Battery Life Marketing Claims vs. Engineering Estimates
&gt; - Engineering claims an 18-month lifespan based on a 10-node mesh size and a 15-minute read interval (~0.19 mAh/day).
&gt; - Marketing slides claim a "2-year" lifespan, which assumes an optimized cell, only 6 nodes, and an incorrect hourly read interval.

&gt; **Contradiction:** Default Read Interval
&gt; - Authoritative specs and current documentation mandate a **15-minute** default read interval.
&gt; - Initial kickoff slides and early notes incorrectly suggested an **hourly** read interval.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt` | text | Unverified |
| 2 | `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md` | text | Unverified |
| 3 | `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt` | text | Unverified |
| 4 | `transcripts/TEST-support-ticket.txt` | text | Medium |

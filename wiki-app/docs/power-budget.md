---
id: power-budget
title: Power Budget
tags:
  - aurora-nova-widget
  - cr2032-battery-capacity
  - meshsync
  - mira-chen
  - power-budget
  - power-budget-estimation
  - sam
  - teabuddy-puck
last_updated: "2026-09-10T14:39:38.589622+00:00"
sidebar_label: Power Budget
slug: /power-budget
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Power Budget

## Overview
The power budget represents the calculated electrical energy consumption of low-power embedded devices, primarily focusing on battery-operated [IoT](./iot.md) [hardware](./hardware.md) like the [Aurora Nova Widget](./aurora-nova-widget.md) and the [TeaBuddy puck](./teabuddy.md). It details operational states, current draws, duty cycles, and daily amp-hour totals to project overall [battery life](./battery-life.md) under various assumptions.

## Key Details
- **Assumptions for Aurora Nova Widget:**
  - **CR2032 Battery Capacity:** Nominal 220 mAh (discounting the 240 mAh specification due to datasheet variance).
  - **Read Interval:** 15 minutes (authoritative specification).
  - **Mesh Size:** 10 nodes (representing a stress case).
- **Aurora Nova Widget Power Breakdown:**
  - **Sleep State:** 4.2 µA current, 99.7% duty cycle, consuming 0.10 mAh daily.
  - **Sample + TX State:** 12 mA current, 0.03% duty cycle, consuming 0.05 mAh daily.
  - **Rejoin Spike:** 180 µA average current, 0.01% duty cycle, consuming 0.04 mAh daily.
  - **Total Consumption:** Approximately 0.19 mAh/day, yielding an engineering longevity claim of roughly 18 months.
- **TeaBuddy Puck Comparison:**
  - Based on figures provided by Sam, the TeaBuddy puck consumes approximately 0.35 mAh/day at 5 steeps, making a 12-month target plausible.

## Related Entities
- **[Mira Chen](./aurora-nova-widget-v2.md):** Author of the Aurora Nova Widget power budget working notes.
- **Sam:** Provided numbers for the TeaBuddy puck power comparison.
- **Aurora Nova Widget:** The primary device analyzed in the power budget working notes utilizing [MeshSync](./meshsync.md).
- **TeaBuddy puck:** A comparable hardware device evaluated alongside the Nova Widget.

## Related Concepts
- **CR2032 Battery Capacity:** Lithium coin cell battery evaluated at a conservative 220 mAh nominal capacity.
- **MeshSync:** [Networking](./networking.md) protocol/technology utilized by the Aurora Nova Widget in a 10-node mesh [configuration](./configuration.md).
- **Power Budget Estimation:** The methodology of balancing sleep currents, transmission duty cycles, and rejoin spikes to predict field life.

## Contradictions
&gt; **Contradiction:** There is a discrepancy between engineering estimates and [marketing](./marketing.md) claims for the Aurora Nova Widget. While engineering calculations show a total consumption of ~0.19 mAh/day resulting in an 18-month battery life (based on a 15-minute read interval, 10-node mesh, and 220 mAh cell), the marketing claim claims "2 years" of life. The marketing claim incorrectly assumes an optimistic cell, a smaller mesh size of 6 nodes, and an hourly read interval instead of the authoritative 15-minute interval.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt` | text | Unverified |

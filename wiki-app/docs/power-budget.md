---
id: power-budget
title: Power Budget
tags:
  - aurora-nova-widget
  - cr2032-battery-capacity
  - meshsync
  - mira-chen
  - power-budget
  - sam
  - teabuddy-puck
last_updated: "2026-09-02T06:41:19.756322+00:00"
sidebar_label: Power Budget
slug: /power-budget
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Power Budget

## Overview

The Power Budget working notes detail the [battery life](./battery-life.md) estimations, consumption states, and operational assumptions for the [Aurora Nova Widget](./aurora-nova-widget.md), authored by Mira Chen. It provides a comparative baseline against the [TeaBuddy](./teabuddy.md) puck and highlights discrepancies between engineering calculations and marketing claims regarding battery longevity.

## Key Details

- **Battery Capacity:** CR2032 assumed at a nominal 220 mAh (accounting for datasheet variance rather than the optimistic 240 mAh).
- **Operational Parameters:** 
  - Read interval: 15 minutes (authoritative specification).
  - Mesh size: 10 nodes (stress case scenario).
- **Consumption Breakdown:**
  - **Sleep:** 4.2 µA current, 99.7% duty cycle, 0.10 mAh daily consumption.
  - **Sample + TX:** 12 mA current, 0.03% duty cycle, 0.05 mAh daily consumption.
  - **Rejoin Spike:** 180 µA average current, 0.01% duty cycle, 0.04 mAh daily consumption.
- **Total Consumption:** Approximately 0.19 mAh/day, yielding an engineering-backed lifespan of roughly 18 months.

## Related Entities

- **Aurora Nova Widget:** The primary device under power evaluation.
- **TeaBuddy puck:** Comparison device evaluated by Sam, consuming ~0.35 mAh/day at 5 steeps, making a 12-month target plausible.
- **Mira Chen:** Author of the power budget working notes.
- **Sam:** Contributor who provided numbers for the TeaBuddy puck comparison.

## Related Concepts

- **CR2032 Battery Capacity:** Coin cell battery standard rated conservatively at 220 mAh for realistic estimations.
- **[MeshSync](./meshsync.md):** [Networking](./networking.md) protocol/architecture operating across the 10-node mesh size stress case.
- **Power Budget Estimation:** The calculation method combining sleep current, sample/TX duty cycles, and rejoin spikes to project total daily mAh drain.

## Contradictions

&gt; **Contradiction:** There is a discrepancy between engineering estimates and marketing claims for the Aurora Nova Widget's battery life. While engineering calculations project ~18 months based on a 15-minute read interval, a 10-node mesh stress case, and a conservative 220 mAh cell, the marketing slide claims "2 years." The marketing claim incorrectly assumes 6 nodes, an optimistic cell capacity, and an hourly read interval.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt` | text | Unverified |

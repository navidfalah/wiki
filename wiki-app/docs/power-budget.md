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
last_updated: "2026-09-01T21:24:37.864262+00:00"
sidebar_label: Power Budget
slug: /power-budget
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Power Budget

## Overview
This wiki page covers the power budget working notes for the [Aurora Nova Widget](./aurora-nova-widget.md), authored by Mira Chen. It details [battery specifications](./battery-specifications.md) assumptions, operational states, duty cycles, and daily [power consumption](./power-consumption.md) calculations, alongside comparisons with related devices like the [TeaBuddy](./teabuddy.md) puck and marketing claims.

## Key Details
- **Battery Capacity:** CR2032 assumed at a nominal 220 mAh (accounting for datasheet variance, rather than an optimistic 240 mAh).
- **Read Interval:** 15 minutes (authoritative specification).
- **Mesh Size:** 10 nodes (stress case scenario).

### Operational State Breakdown
| State | Current | Duty Cycle | Daily Consumption |
|-------|---------|------------|-------------------|
| Sleep | 4.2 µA | 99.7% | 0.10 mAh |
| Sample + TX | 12 mA | 0.03% | 0.05 mAh |
| Rejoin spike | 180 µA avg | 0.01% | 0.04 mAh |

- **Total Estimated Consumption:** ~0.19 mAh/day
- **Engineering Lifetime Claim:** ~18 months

## Related Entities
- **Aurora Nova Widget:** The primary device evaluated in these power budget notes.
- **Mira Chen:** Author of the power budget working notes.
- **Sam:** Provided the comparative numbers for the TeaBuddy puck.
- **TeaBuddy puck:** A comparable device referenced for power analysis (~0.35 mAh/day @ 5 steeps, making a 12-month target plausible).

## Related Concepts
- **CR2032 Battery Capacity:** Lithium coin cell battery evaluated under realistic variance conditions (220 mAh).
- **[MeshSync](./meshsync.md):** Network protocol or synchronization mechanism operating across the 10-node mesh network stress case.
- **Power Budget Estimation:** The methodology of balancing sleep currents, sample/transmission spikes, and duty cycles to project device lifespan.

## Contradictions
&gt; **Contradiction:** There is a discrepancy between engineering calculations and marketing claims regarding [battery life](./battery-life.md). While engineering estimates a realistic lifespan of ~18 months based on a 15-minute read interval, 10 nodes, and a conservative 220 mAh cell, the marketing slide claims "2 years" by incorrectly assuming 6 nodes, an optimistic cell, and an hourly read interval.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt` | text | Unverified |

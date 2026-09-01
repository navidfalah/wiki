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
last_updated: "2026-09-01T19:20:33.420209+00:00"
sidebar_label: Power Budget
slug: /power-budget
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Power Budget

## Overview
This wiki page documents the power budget working notes for the [Aurora Nova Widget](./aurora-nova-widget.md), authored by [Mira Chen](./aurora-labs.md). It details [power consumption](./power-consumption.md) assumptions, device states, duty cycles, and [battery life](./battery-life.md) estimations using a CR2032 coin cell battery, alongside a comparative analysis with the [TeaBuddy puck](./teabuddy.md).

## Key Details
- **[Battery Specifications](./battery-specifications.md):** CR2032 nominal capacity is calculated at 220 mAh (accounting for datasheet variance, rather than an optimistic 240 mAh).
- **Operational Assumptions:** 
  - Read interval: 15 minutes (authoritative specification).
  - Mesh size: 10 nodes (evaluated as a stress case).

### Aurora Nova Widget Power States
| State | Current | Duty | Daily mAh |
|-------|---------|------|-----------|
| Sleep | 4.2 µA | 99.7% | 0.10 |
| Sample+TX | 12 mA | 0.03% | 0.05 |
| Rejoin spike | 180 µA avg | 0.01% | 0.04 |

- **Total Consumption:** Approximately 0.19 mAh/day.
- **Estimated Lifespan:** ~18 months (engineering claim).

## Related Entities
- **Mira Chen:** Author of the Aurora Nova Widget power budget working notes and estimation calculations.
- **Sam:** Contributor who provided comparative numbers for the TeaBuddy puck.
- **Aurora Nova Widget:** The primary [hardware](./hardware.md) device evaluated in the power budget calculations.
- **TeaBuddy puck:** A comparative device evaluated for power consumption.

## Related Concepts
- **CR2032 Battery Capacity:** A coin cell lithium battery specified here with a realistic 220 mAh nominal capacity.
- **MeshSync:** The underlying [networking](./networking.md) protocol/mesh context used in the 10-node stress case.
- **Power Budget Estimation:** The methodology of summing sleep, sample/transmit, and rejoin spike currents against duty cycles to forecast battery longevity.

## Contradictions
&gt; **Contradiction:** The marketing slide claim of "2 years" for the Aurora Nova Widget battery life assumes 6 nodes, an optimistic cell, and hourly reads (which contradicts the authoritative 15-minute read interval specification). Based on engineering calculations with realistic assumptions (10 nodes, 15-minute reads, 220 mAh capacity), the actual expected lifespan is approximately 18 months at ~0.19 mAh/day.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt` | text | Unverified |

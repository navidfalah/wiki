---
id: battery-life
title: Battery Life
tags:
  - alex
  - alex-kim
  - aurora-labs
  - aurora-nova-widget
  - battery-duty-cycles
  - battery-life
  - battery-specification
  - battery-target
last_updated: "2026-09-10T14:37:17.486358+00:00"
sidebar_label: Battery Life
slug: /battery-life
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Battery Life

## Overview
Battery performance and power budgeting for the [Aurora Nova Widget](./aurora-nova-widget.md) (v2) involve balancing reading intervals, mesh density, and [hardware](./hardware.md) constraints. While [marketing](./marketing.md) materials often highlight a two-year lifespan, internal engineering estimates and [power budget](./power-budget.md) working notes account for realistic deployment scenarios, such as 10-node mesh deployments using a CR2032 primary cell.

## Key Details
- **Hardware Cell:** CR2032 primary cell (nominal 220mAh, accounting for datasheet variance). 
- **Reading Interval:** Default reading interval is set to 15 minutes during active mesh operation (configurable between 5 minutes and 24 hours via the companion app). Initial kickoff notes and drafts previously mentioned an hourly default.
- **Power Budget (10-Node Stress Case):**
  - **Sleep:** 4.2 µA (99.7% duty cycle, 0.10 mAh/day)
  - **Sample + TX:** 12 mA (0.03% duty cycle, 0.05 mAh/day)
  - **Rejoin Spike:** 180 µA average (0.01% duty cycle, 0.04 mAh/day)
  - **Total:** ~0.19 mAh/day
- **Lifespan Targets:**
  - **Engineering Target:** ~18 months minimum at a 10-node deployment.
  - **Marketing Target:** 24 months (which assumes a more optimistic cell, a moderate mesh of $\le 6$ nodes, and hourly reads).

&gt; **Contradiction:** Early external materials and blogs (such as an early teardown by Alex Kim) incorrectly stated that the device used a CR2450 battery. This has since been corrected to the CR2032. Similarly, discrepancies exist between marketing claims of a 2-year battery life and internal engineering targets of 18 months, which vary depending on whether the deployment uses 10 nodes with 15-minute intervals or smaller node counts with hourly readings.

## Related Entities
- **[Aurora Labs](./aurora-labs.md):** Creator of the Nova Widget.
- **Nova Widget:** The second-generation soil/environment sensor utilizing the CR2032 battery.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Author of the power budget working notes and [product specification](./product-specification.md) drafts.
- **Jonah Park:** Team member collaborating on marketing and engineering alignment.
- **Alex Kim:** Teardown blogger and co-host of [TeaBuddy](./teabuddy.md) who initially published the incorrect CR2450 battery specification.
- **TeaBuddy:** A separate [puck](./teabuddy.md) product by Alex Kim that shares battery discussion contexts but uses a different puck chemistry and haptic draw.

## Related Concepts
- **[MeshSync](./meshsync.md):** The self-healing mesh protocol that influences current consumption and daily mAh duty cycles.
- **[Power Budget](./power-budget.md):** Calculations tracking sleep current, sample/TX duration, and rejoin spikes.
- **Duty Cycles:** The proportional time spent in sleep, sampling, and transmission states.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt` | text | Unverified |
| 2 | `dummy-test/articles/2026-05-15-product-spec-draft.md` | text | Unverified |
| 3 | `dummy-test/articles/scraped-forum-thread.txt` | text | Unverified |
| 4 | `samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt` | text | Unverified |
| 5 | `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt` | text | Unverified |
| 6 | `samples/transcripts/[SAMPLE]-2026-07-11-podcast-outline-unrecorded.txt` | text | Unverified |
| 7 | `transcripts/2026-06-05-sync-fragment.txt` | text | Medium |

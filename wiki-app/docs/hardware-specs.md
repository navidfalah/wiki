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
last_updated: "2026-09-01T19:19:11.779234+00:00"
sidebar_label: Hardware Specs
slug: /hardware-specs
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Specs

## Overview
This wiki page outlines the [hardware specifications](./hardware-specifications.md), power budgets, and device details for the [Aurora Nova Widget](./aurora-nova-widget.md), along with comparisons to related devices such as the [TeaBuddy](./teabuddy.md) puck and [SenseNode SN-400](./sensenode-sn-400.md).

## Key Details

### Aurora Nova Widget Specifications
- **Battery:** CR2032 coin cell battery (nominal 220 mAh capacity, accounting for datasheet variance).
- **Default Read Interval:** 15 minutes (note: some kickoff [documentation](./documentation.md) and marketing materials previously referenced an hourly interval).
- **Mesh Protocol:** Uses MeshSync.
- **Ingress Protection (IP) Rating:** IP54 beta.

### Power Budget & Battery Life (Aurora Nova Widget)
Based on engineering calculations assuming a 10-node mesh size (stress case) and a 15-minute read interval:

| State | Current | Duty Cycle | Daily Consumption |
|-------|---------|------------|-------------------|
| Sleep | 4.2 µA | 99.7% | 0.10 mAh |
| Sample + TX | 12 mA | 0.03% | 0.05 mAh |
| Rejoin spike | 180 µA avg | 0.01% | 0.04 mAh |

- **Total Consumption:** ~0.19 mAh/day.
- **Target Lifespan:** ~18 months (engineering claim). 
- *Note:* Marketing slides claiming a "2-year" lifespan assume 6 nodes, an optimistic cell, and hourly reads.

## Related Entities
- **Aurora Nova Widget:** The primary device covered by these hardware specifications.
- **TeaBuddy:** A puck device using [BLE](./ble.md) (not mesh) with different chemistry. It draws more current due to haptics (~0.35 mAh/day across 5 steeps) with a 12-month target. Sam Rivera advises against sharing or merging codebases with TeaBuddy.
- **SenseNode SN-400:** An alternative outdoor device featuring an IP67 waterproof rating, compared to the Nova Widget's IP54 beta rating.

## Related Concepts
- **MeshSync:** The proprietary [mesh networking](./mesh-networking.md) protocol used by the Nova Widget.
- **[Power Budget](./power-budget.md):** The calculation of current draws across sleep, sample/transmit, and rejoin spike states to estimate overall battery longevity.

## Contradictions

&gt; **Contradiction:** Battery Type Discrepancy
&gt; Some documentation, including a post on Alex's blog, incorrectly cited the battery as a CR2450. Engineering and current specifications strictly mandate the use of the CR2032 cell.

&gt; **Contradiction:** Default Read Interval
&gt; Kickoff slides and early discussions mentioned an hourly read interval, whereas the authoritative specification mandates a 15-minute default read interval.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt` | text | Unverified |
| 2 | `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md` | text | Unverified |
| 3 | `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt` | text | Unverified |
| 4 | `transcripts/TEST-support-ticket.txt` | text | Medium |

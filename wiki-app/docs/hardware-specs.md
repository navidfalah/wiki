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
last_updated: "2026-09-01T21:23:20.172875+00:00"
sidebar_label: Hardware Specs
slug: /hardware-specs
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Specs

## Overview
This document outlines the [hardware specifications](./hardware-specifications.md), power budgets, and operational characteristics for the [Aurora Nova Widget](./aurora-nova-widget.md), along with relevant cross-references to comparative devices such as the [TeaBuddy](./teabuddy.md) puck and [SenseNode SN-400](./sensenode-sn-400.md).

## Key Details

### Aurora Nova Widget Hardware Specifications
- **Battery:** Uses a CR2032 coin cell battery with a nominal capacity of 220 mAh (datasheet variance accounts for not using 240 mAh). *(Note: Some early [documentation](./documentation.md) and Alex's blog incorrectly referenced the CR2450 battery.)*
- **Default Read Interval:** 15 minutes. *(Note: Kickoff slides and initial documents incorrectly stated an hourly interval.)*
- **Mesh Protocol:** [MeshSync](./meshsync.md).
- **Ingress Protection (IP) Rating:** IP54 beta rating.
- **[Power Consumption](./power-consumption.md) & Current States:**
  - **Sleep State:** 4.2 µA (99.7% duty cycle, ~0.10 mAh/day)
  - **Sample + TX:** 12 mA (0.03% duty cycle, ~0.05 mAh/day)
  - **Rejoin Spike:** 180 µA average (0.01% duty cycle, ~0.04 mAh/day)
- **[Battery Life](./battery-life.md):** 
  - Engineering claim is approximately 18 months total based on a stress case of 10 nodes (~0.19 mAh/day).
  - Marketing slides claiming "2 years" assume 6 nodes, an optimistic cell, and an incorrect hourly read interval.

## Related Entities
- **Aurora Nova Widget:** The primary device governed by these hardware specs.
- **TeaBuddy:** A separate puck device utilizing [BLE](./ble.md) rather than a mesh protocol, featuring a different chemistry and higher draw due to haptics (~0.35 mAh/day @ 5 steeps). Sam Rivera manages TeaBuddy numbers.
- **SenseNode SN-400:** An alternative outdoor device featuring an IP67 waterproof rating.
- **[Mira Chen](./nova-widget.md) & Jonah Park:** Key engineering team members tracking power budgets and spec corrections.
- **Alex:** Author of a blog post containing incorrect [Battery Specifications](./battery-specifications.md).

## Related Concepts
- **[Power Budget](./power-budget.md):** The calculation of daily milliamp-hours (mAh) consumed across sleep, sample/TX, and rejoin states.
- **MeshSync:** The proprietary [mesh networking](./mesh-networking.md) protocol used by the Nova Widget.
- **IP Ratings:** Environmental protection standards comparing the Nova Widget's IP54 beta rating to SenseNode's IP67 rating.

## Contradictions

&gt; **Contradiction:** Battery model discrepancies appear across early sources. While some documentation and Alex's blog cite a CR2450 battery, the authoritative engineering specification and working power budget notes confirm the device exclusively uses the CR2032 coin cell.

&gt; **Contradiction:** The default read interval was inconsistently communicated. Initial kickoff slides and some notes mentioned an hourly read interval, but the authoritative specification mandates a 15-minute default read interval.

&gt; **Contradiction:** Expected battery longevity varies by messaging source. Engineering claims an 18-month lifespan under a 10-node stress test, whereas marketing slides promote a 2-year lifespan based on fewer nodes and an incorrect hourly read interval.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt` | text | Unverified |
| 2 | `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md` | text | Unverified |
| 3 | `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt` | text | Unverified |
| 4 | `transcripts/TEST-support-ticket.txt` | text | Medium |

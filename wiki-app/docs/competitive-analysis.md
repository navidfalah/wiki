---
id: competitive-analysis
title: Competitive Analysis
tags:
  - alex
  - aurora-labs
  - battery-life-claims
  - cheapoco
  - co-marketing-partnership
  - competitive-analysis
  - competitive-battlecards
  - garden-and-soil-sensors
last_updated: "2026-09-02T06:39:01.640432+00:00"
sidebar_label: Competitive Analysis
slug: /competitive-analysis
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Competitive Analysis

## Overview
This document outlines the Q3 2026 competitive landscape for [Aurora Labs](./aurora-labs.md), detailing garden and soil sensor competitors, adjacent lifestyle products, battlecard strategies, and technical specifications for the [Nova Widget](./nova-widget.md).

## Key Details
- **[Aurora Labs Nova](./aurora-nova-widget-v2.md) Widget Specifications:**
  - Mesh Protocol: [MeshSync](./meshsync.md)
  - Cloud: Optional
  - Waterproof Rating: IP54 (Note: Jonah Park mentioned it is IP54 for beta, and will be upgraded to IP65 once tooling is funded).
  - Battery: CR2032 (Note: Contradiction noted regarding Amazon draft stating CR2450).
  - [Battery Life](./battery-life.md): Engineering estimates 18 months at 10 nodes with 15-minute reads; marketing rounds this to 2 years, with the spreadsheet being published publicly.
  - Moat: Local mesh without a subscription, partial open [firmware](./firmware.md), and community integrations.
  - Mesh Stability: An eight-node mesh issue was mitigated in firmware version 0.3.8, though six nodes are recommended for beta customers.
- **Competitor: [SenseNode SN-400](./sensenode-sn-400.md) (SN-400)**
  - Protocol/Connectivity: [LoRaWAN](./lorawan.md)
  - Cloud: Required
  - Waterproof Rating: IP67
  - Battery: CR2450
- **Competitor: CheapoCo (SoilStick)**
  - Protocol/Connectivity: WiFi
  - Cloud: Required
  - Waterproof Rating: None
  - Battery: USB
- **Adjacent Kitchen / Lifestyle Product: [TeaBuddy](./teabuddy.md) (Puck)**
  - Protocol: [BLE](./ble.md) (local-only tea timer)
  - Status: Considered a co-marketing partnership rather than a direct competitor (Alex is friends with the team; no merge planned).
- **Adjacent Kitchen / Lifestyle Product: TimerCap**
  - Status: Kickstarter failed in 2024, mechanical and non-smart.

## Related Entities
- **Aurora Labs**
- **SenseNode**
- **CheapoCo**
- **TeaBuddy**
- **TimerCap**
- **Jonah Park**
- **[Mira Chen](./aurora-nova-widget-v2.md)**
- **Alex**

## Related Concepts
- **Garden and Soil [Sensors](./sensors.md)**
- **Competitive Battlecards**
- **Battery Life Claims**
- **Co-Marketing Partnership**

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the Nova Widget's battery type. The internal Q3 competitive landscape document specifies a **CR2032** coin cell battery, whereas the Amazon draft copy mistakenly lists a **CR2450** battery (which needs to be fixed before publishing).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-09-competitive-landscape-q3.md` | text | Unverified |
| 2 | `samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt` | text | Unverified |

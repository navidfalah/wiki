---
id: market-research
title: Market Research
tags:
  - aurora-labs
  - cheapoco
  - competitive-battlecards
  - garden-and-soil-sensors
  - market-research
  - sensenode
  - teabuddy
  - wiki
last_updated: "2026-09-02T06:40:36.941842+00:00"
sidebar_label: Market Research
slug: /market-research
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Market Research

## Overview
This wiki page outlines the Q3 2026 competitive landscape analysis for [Aurora Labs](./aurora-labs.md), authored by Jonah Park. It evaluates key competitors in the garden/soil sensor market and adjacent kitchen/lifestyle products, while providing battlecard updates and tracking internal [documentation](./documentation.md) discrepancies.

## Key Details

### Garden / Soil Sensors
| Vendor | Product | Mesh | Cloud | Waterproof | Battery |
|--------|---------|------|-------|------------|---------|
| Aurora Labs | [Nova Widget](./nova-widget.md) | [MeshSync](./meshsync.md) | optional | IP54 | CR2032 |
| SenseNode | SN-400 | [LoRaWAN](./lorawan.md) | required | IP67 | CR2450 |
| CheapoCo | SoilStick | WiFi | required | none | USB |

### Kitchen / Lifestyle (Adjacent)
| Vendor | Product | Protocol | Notes |
|--------|---------|----------|-------|
| [TeaBuddy](./teabuddy.md) | Puck | [BLE](./ble.md) | local-only tea timer |
| TimerCap | KS failed 2024 | mechanical | not smart |

### Competitive Battlecard Updates
- **SenseNode:** Emphasize the long-term subscription cost over a 3-year period when competing against them.
- **TeaBuddy:** Classified as a non-competitor; pursue partnership and co-marketing opportunities only.

## Related Entities
- Aurora Labs (Nova Widget)
- SenseNode (SN-400)
- CheapoCo (SoilStick)
- TeaBuddy (Puck)
- TimerCap

## Related Concepts
- Garden and soil [sensors](./sensors.md)
- [Mesh networking](./mesh-networking.md) (MeshSync, LoRaWAN, WiFi)
- Cloud requirements
- [Hardware specifications](./hardware-specifications.md) (IP ratings, battery types)
- Competitive battlecards

## Contradictions
&gt; **Contradiction:** An internal Amazon draft stated that the Nova Widget uses a CR2450 battery, whereas the official product spec table lists it as using a CR2450 versus CR2032 discrepancy that needs to be fixed before publishing. *(Note: The spec table lists the Nova Widget battery as CR2032, while the Amazon draft mentioned CR2450).*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-09-competitive-landscape-q3.md` | text | Unverified |

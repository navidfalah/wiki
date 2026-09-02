---
id: product-engineering
title: Product Engineering
tags:
  - cr2032
  - data-sovereignty
  - ip-enclosure-rating
  - jonah
  - mesh-network-scaling
  - mira
  - product-engineering
  - wiki
last_updated: "2026-09-02T06:41:29.235932+00:00"
sidebar_label: Product Engineering
slug: /product-engineering
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Engineering

## Overview
Product engineering encompasses the day-to-day development, [hardware](./hardware.md) prototyping, and infrastructure maintenance for our connected device initiatives. The guiding product vision continues to be centered around "open [sensors](./sensors.md) for people who own their data." Recent engineering standups highlight active challenges in mesh network optimization, hardware enclosure prototyping, [power management](./power-management.md), and internal tooling maintenance.

## Key Details
- **Mesh Network Scaling:** Testing at 8 nodes reveals lingering behavioral anomalies, including a current spike of 110 µA during node rejoin operations. This behavior has been categorized as acceptable for beta releases ("fine for beta").
- **Enclosure and Gasket Prototyping:** Gasket samples evaluated by Jonah are currently underwhelming. While achieving an IP54 rating is acceptable, upgrading to an IP65 ingress protection rating requires a tooling redesign costing $8,000.
- **Power and Components:** 
  - Disagreements exist regarding solar trickle charging: Jonah supports the feature, whereas [Mira](./aurora-nova-widget-v2.md) opposes it.
  - Ongoing curiosities persist regarding component sourcing, specifically why CR2032 coin cell batteries carry a price premium at hardware stores compared to online retailers.
- **[Documentation](./documentation.md) and Infrastructure:** 
  - Wiki updates have faced recurring lapses.
  - Staging environment maintenance includes a pending task to investigate and fix a malfunctioning cron job.
- **Testing Procedures:** Standard evaluation routines include physical touch testing and incremental testing.

## Related Entities
- **Mira:** Team member overseeing mesh network testing and node performance; holds reservations regarding solar trickle charging.
- **Jonah:** Team member managing hardware enclosures and gasket samples; advocates for solar trickle charging.

## Related Concepts
- **Data Sovereignty:** Reflected in the core product philosophy of building "open sensors for people who own their data."
- **IP Enclosure Rating:** Standards (such as IP54 and IP65) governing dust and water resistance of hardware casings, heavily influenced by tooling investments.
- **Mesh Network Scaling:** The behavior, stability, and power efficiency of multi-node wireless networks as node count increases.
- **Power Management:** Optimization of [battery life](./battery-life.md), including handling rejoin current spikes (110 µA) and evaluating alternative power sources like CR2032 cells and solar trickle.

## Contradictions
*(No direct contradictions found in the current source materials.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/2026-06-01-standup-scribbles.txt` | text | Medium |

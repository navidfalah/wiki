---
id: product-specification
title: Product Specification
tags:
  - alex
  - ip-rating-requirements
  - jonah
  - meshsync
  - mira
  - product-specification
  - wiki
last_updated: "2026-09-01T21:24:55.168512+00:00"
sidebar_label: Product Specification
slug: /product-specification
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Specification

## Overview
This wiki page compiles specifications, component details, and current engineering status for [Aurora Labs](./aurora-labs.md) products, incorporating updates regarding [hardware](./hardware.md) components, IP ratings, and [MeshSync](./meshsync.md) performance metrics.

## Key Details
- **MeshSync Stability:** MeshSync is currently stable at 8 nodes, though engineers are still observing a power spike to 110 µA when a node rejoins the network.
- **Enclosure & IP Ratings:** Gasket samples have arrived. The IP54 rating is deemed sufficient for the [beta testing](./beta-testing.md) release, while upgrading to IP65 requires an $8k tooling investment as noted in the [product specifications](./product-specifications.md).
- **Battery Component:** The device utilizes CR2032 [batteries](./battery-life.md) (corrections supersede previous teardown notes that incorrectly referenced CR2450).

## Related Entities
- **Aurora Labs:** The organization developing the hardware and [MeshSync protocol](./meshsync-protocol.md).
- **[Mira](./nova-widget.md):** Engineering team member who flagged MeshSync metrics, IP rating tool costs, telemetry intervals, and [battery specifications](./battery-specifications.md).
- **Jonah:** Engineering team member who reviewed gasket samples and clarified specification discrepancies.
- **Alex:** Team member whose previous teardown report contained an error regarding the battery type.

## Related Concepts
- **MeshSync:** Node [networking](./networking.md) protocol currently stable at 8 nodes with specific power rejoin behavior.
- **Ingress Protection (IP) Ratings:** Standards governing moisture and dust resistance (IP54 for beta vs. IP65 for production).
- **Telemetry Reporting Intervals:** Data reporting frequency for beta testers.

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the default telemetry reporting interval promised to beta testers. The product specification document states a 15-minute default, whereas the [project kickoff](./project-kickoff.md) notes specified an hourly default.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `transcripts/2026-05-28-weekly-sync.md` | text | Medium |

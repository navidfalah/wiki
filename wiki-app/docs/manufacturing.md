---
id: manufacturing
title: Manufacturing
tags:
  - aurora-labs
  - data-ownership-ethos
  - ip-rating-constraints
  - jonah
  - manufacturing
  - mesh-rejoin-power-spike
  - mira
  - wiki
last_updated: "2026-09-10T14:39:05.029012+00:00"
sidebar_label: Manufacturing
slug: /manufacturing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Manufacturing

## Overview
This wiki page captures recent [standup notes](./standup-notes.md), [hardware](./hardware.md) prototyping status, engineering updates, and ongoing design considerations related to manufacturing processes and device assembly.

## Key Details
- **Mesh Network Performance:** The mesh network is currently operating at 8 nodes, though behavior remains somewhat unusual. A power spike of 110 µA occurs upon rejoin, which has been evaluated as acceptable ("fine for beta").
- **Enclosure and Sealing (Gaskets):** Gasket samples evaluated by Jonah have been underwhelming ("meh"). While an IP54 rating is acceptable, achieving an IP65 rating would require an expensive $8,000 tooling modification.
- **Power and Solar Considerations:** There is an open internal debate regarding solar trickle charging, with Jonah supporting the idea and [Mira](./aurora-nova-widget-v2.md) opposed.
- **Component Sourcing & Philosophy:** The project aligns with the guiding ethos *"open [sensors](./sensors.md) for people who own their data"*. Miscellaneous hardware observations note that CR2032 cells are notably more expensive at local hardware stores compared to online options.
- **Administrative Tasks:** [Wiki maintenance](./wiki-maintenance.md) issues persist (noted as forgotten updates), alongside staging cron job fixes.

## Related Entities
- **Mira:** Engineering team member who oversees mesh network performance and holds reservations regarding solar trickle charging.
- **Jonah:** Engineering team member handling physical prototyping, gasket samples, and supporting solar trickle integration.
- **[Aurora Labs](./aurora-labs.md):** Associated organizational context for the open sensors initiative.

## Related Concepts
- **IP Rating Constraints:** The trade-offs between meeting higher environmental ingress protection standards (such as moving from IP54 to IP65) and incurring significant tooling costs ($8k).
- **Mesh Rejoin Power Spike:** The specific electrical behavior (110 µA current spike) observed when nodes rejoin the network during [beta testing](./beta-testing.md).
- **Data Ownership Ethos:** The foundational project philosophy emphasizing open sensors and user data ownership.

## Contradictions
&gt; **Contradiction:** There is a direct internal disagreement between team members regarding solar trickle charging: Jonah is in favor of implementing it, whereas Mira is opposed.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/2026-06-01-standup-scribbles.txt` | text | Medium |

---
id: team-standup
title: Team Standup
tags:
  - aurora-labs
  - data-ownership-ethos
  - ip-rating-constraints
  - jonah
  - mesh-rejoin-power-spike
  - mira
  - team-standup
  - wiki
last_updated: "2026-09-10T14:40:58.615754+00:00"
sidebar_label: Team Standup
slug: /team-standup
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Team Standup

## Overview
This wiki page captures the rough notes and action items from a team standup meeting (recorded around early June 2026). The discussion touches upon [hardware](./hardware.md) [testing](./testing.md), mesh network performance, environmental sealing constraints, and foundational project ethos.

## Key Details
- **Mesh Network Performance:** [Mira](./aurora-nova-widget-v2.md) reported that the network mesh behavior remains unusual at 8 nodes, noting a power spike of 110 µA upon rejoin, which is currently deemed "fine for beta."
- **Hardware & Enclosures:** Jonah evaluated gasket samples and found them mediocre. While an IP54 rating is acceptable, achieving an IP65 rating would require an expensive $8,000 tool rip.
- **[Documentation](./documentation.md):** The author admitted to forgetting to update the wiki again.
- **Project Ethos:** The guiding philosophy "open [sensors](./sensors.md) for people who own their data" was reaffirmed as still relevant.
- **Random Observations:** A side note questions why CR2032 button cell batteries are more expensive at local hardware stores compared to online retailers.

## Related Entities
- **Mira** (Team member focused on [mesh networking](./mesh-networking.md) and power behavior)
- **Jonah** (Team member handling hardware enclosures, gaskets, and components)
- **[Aurora Labs](./aurora-labs.md)** (Implied organizational context tied to the data ownership ethos)

## Related Concepts
- **Mesh-Rejoin Power Spike:** The 110 µA surge observed when nodes reconnect to the network during [beta testing](./beta-testing.md).
- **IP Rating Constraints:** The trade-offs between cost and environmental protection levels (IP54 vs. IP65 tooling costs).
- **Data-Ownership Ethos:** The core mission statement emphasizing open sensors and user data autonomy.
- **Testing Methodologies:** Mention of touch tests and incremental tests.

## Contradictions
&gt; **Contradiction:** There is an unresolved disagreement regarding solar trickle charging between team members: Jonah is in favor ("yes"), while Mira is opposed ("no").

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/2026-06-01-standup-scribbles.txt` | text | Medium |

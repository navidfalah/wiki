---
id: standup-notes
title: Standup Notes
tags:
  - cr2032
  - data-sovereignty
  - ip-enclosure-rating
  - jonah
  - mesh-network-scaling
  - mira
  - standup-notes
  - wiki
last_updated: "2026-09-01T19:21:41.277473+00:00"
sidebar_label: Standup Notes
slug: /standup-notes
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Standup Notes

## Overview
This wiki page captures the rough notes and scribbles from a team standup meeting in early June 2026. The session covered mesh network scaling issues, [hardware](./hardware.md) enclosure testing, [wiki maintenance](./wiki-maintenance.md) tasks, and conflicting opinions on solar trickle charging.

## Key Details
- **Mesh Network ([Mira](./aurora-labs.md)):** The mesh network is still exhibiting unusual behavior at 8 nodes, showing a 110µA spike on rejoin, which is currently considered "fine for beta."
- **Enclosures (Jonah):** Gasket samples arrived and are underwhelming. IP54 is acceptable, but upgrading to an IP65 rating would require an $8,000 tooling rip.
- **Wiki Maintenance:** The author acknowledged forgetting to update the wiki again.
- **Action Items & TODOs:**
  - Fix the cron job on staging (tentative).
  - Resolve the disagreement regarding solar trickle charging.
  - Get lunch.
- **Miscellaneous Thoughts:** 
  - Questioning why CR2032 coin cell batteries are more expensive at hardware stores compared to online retailers.
  - Re-evaluating the guiding tagline: *"open [sensors](./sensors.md) for people who own their data"*.
  - Noted tags for future checks: `#touch test` and `#incremental test`.

## Related Entities
- **Mira:** Team member overseeing mesh network performance and scaling behavior.
- **Jonah:** Team member handling hardware enclosures, gaskets, and IP ratings.

## Related Concepts
- **Mesh Network Scaling:** Observing behavior and [power consumption](./power-consumption.md) spikes (e.g., 110µA rejoin spikes) as node counts increase during the beta phase.
- **IP Enclosure Ratings:** The trade-offs between enclosure protection levels (IP54 vs. IP65) and associated tooling costs.
- **Data Sovereignty:** The core mission and philosophy embodied by the tagline "open sensors for people who own their data."

## Contradictions
&gt; **Contradiction:** There is an internal disagreement regarding solar trickle charging between team members: Jonah is in favor ("yes"), while Mira is against it ("no").

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/2026-06-01-standup-scribbles.txt` | text | Medium |

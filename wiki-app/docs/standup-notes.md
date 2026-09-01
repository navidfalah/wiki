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
last_updated: "2026-09-01T21:25:46.018978+00:00"
sidebar_label: Standup Notes
slug: /standup-notes
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Standup Notes

## Overview
This wiki page captures the rough notes, updates, and action items from a team standup meeting held in early June 2026. The discussion covered [mesh networking](./mesh-networking.md) metrics, enclosure [hardware](./hardware.md) prototyping, data sovereignty principles, and internal task tracking.

## Key Details
* **Mesh Network Status:** [Mira](./nova-widget.md) reported that the mesh network is still exhibiting unusual behavior at 8 nodes, noting a spike of 110µA upon node rejoin. Despite this, it was deemed "fine for beta."
* **Hardware & Enclosures:** Jonah evaluated gasket samples and found them to be mediocre. While the current samples achieve an IP54 rating, upgrading to IP65 would require an expensive tooling redesign costing $8,000.
* **Wiki & [Documentation](./documentation.md):** The author acknowledged a recurring lapse in keeping the project wiki updated.
* **Open Questions & Random Observations:** 
  * A debate arose regarding solar trickle charging: Jonah expressed approval ("yes"), while Mira expressed disapproval ("no").
  * A side observation questioned why CR2032 coin cell batteries carry a higher price tag at local hardware stores compared to online retailers.
* **Core Philosophy:** The team briefly revisited the guiding mantra: *"open [sensors](./sensors.md) for people who own their data"*, affirming its ongoing relevance.

## Related Entities
* **Mira:** Team member overseeing mesh network performance and expressing skepticism toward solar trickle charging.
* **Jonah:** Team member handling hardware prototyping (gaskets and enclosures) who supports solar trickle charging.

## Related Concepts
* **Data Sovereignty:** Highlighted by the mission statement focusing on user ownership of sensor data.
* **Mesh Network Scaling:** Examined via the behavior and power draw anomalies observed at an 8-node threshold.
* **IP Enclosure Ratings:** Evaluated through the comparison between IP54 and IP65 standards and associated tooling costs.
* **[Power Management](./power-management.md):** Discussed in the context of node rejoin spikes (110µA), coin cell battery economics (CR2032), and solar trickle options.

## Contradictions
&gt; **Contradiction:** There is a direct disagreement between team members regarding the implementation of solar trickle charging: Jonah supports it ("yes"), whereas Mira opposes it ("no").

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/2026-06-01-standup-scribbles.txt` | text | Medium |

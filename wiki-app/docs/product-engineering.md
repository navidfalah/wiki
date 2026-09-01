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
last_updated: "2026-09-01T19:20:43.208803+00:00"
sidebar_label: Product Engineering
slug: /product-engineering
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Engineering

## Overview
Product Engineering encompasses the cross-functional efforts required to design, test, and iterate on [hardware](./hardware.md) and [firmware](./firmware.md) systems—balancing performance, power constraints, hardware enclosures, and network scaling. Recent [engineering standup](./engineering-standup.md) notes highlight ongoing work regarding mesh network scaling, enclosure prototyping, [power management](./power-management.md) questions, and core product philosophy.

## Key Details
* **Mesh Network Scaling:** [Mira](./aurora-labs.md) reports that the mesh network exhibits strange behavior at 8 nodes, noting a current spike of 110 µA upon rejoin. This behavior has been deemed "fine for beta."
* **Enclosure Prototyping:** Jonah evaluated gasket samples, concluding that while an IP54 rating is acceptable, achieving an IP65 rating would require a costly $8,000 tool rip.
* **Power & Components:** 
  * A team debate exists regarding solar trickle charging: Jonah supports it, while Mira opposes it.
  * A hardware store pricing discrepancy was noted regarding CR2032 coin cell batteries compared to online vendors.
* **Core Philosophy:** The guiding product vision remains anchored in the principle: *"open [sensors](./sensors.md) for people who own their data"*.
* **Pending Tasks:** Maintenance items include fixing the staging cron job, resolving the solar trickle debate, and updating the project wiki.

## Related Entities
* **Mira:** Team member handling mesh network evaluation and opposing solar trickle integration.
* **Jonah:** Team member handling enclosure/gasket samples and supporting solar trickle integration.

## Related Concepts
* **Mesh Network Scaling:** Evaluating network reliability and current consumption (e.g., rejoin spikes) as node counts increase.
* **IP Enclosure Rating:** Designing protective enclosures for environmental resistance, balancing sealing levels (IP54 vs. IP65) against tooling costs.
* **Data Sovereignty:** Designing open sensor architectures centered around user data ownership.

## Contradictions
&gt; **Contradiction:** There is an internal disagreement between Jonah and Mira regarding the inclusion of solar trickle functionality, with Jonah in favor and Mira against.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/2026-06-01-standup-scribbles.txt` | text | Medium |

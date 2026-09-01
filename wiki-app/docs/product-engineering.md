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
last_updated: "2026-09-01T21:24:47.428276+00:00"
sidebar_label: Product Engineering
slug: /product-engineering
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Engineering

## Overview
Product engineering encompasses the design, [hardware](./hardware.md) selection, and network architecture of connected devices. Recent [standup notes](./standup-notes.md) highlight ongoing development challenges regarding mesh network scaling, hardware enclosure tooling costs, [power management](./power-management.md) (including CR2032 batteries and solar charging), and maintaining core product ethos around data ownership ("open [sensors](./sensors.md) for people who own their data").

## Key Details
- **Mesh Network Scaling ([Mira](./nova-widget.md)):** [Mesh networking](./mesh-networking.md) behavior becomes irregular at 8 nodes, exhibiting a current spike of 110µA upon rejoin, which is currently deemed "fine for beta."
- **Enclosures and Hardware (Jonah):** Gasket samples have tested unsatisfactorily ("meh"). While an IP54 rating is acceptable, upgrading to an IP65 rating would require an expensive $8,000 tool rip.
- **Power & Components:** 
  - [Power consumption](./power-consumption.md) optimization remains a focal point, including handling rejoins and evaluating solar trickle charging feasibility.
  - CR2032 coin cell batteries exhibit price discrepancies between hardware stores and online vendors.
- **Product Vision:** The core guiding mantra continues to be "open sensors for people who own their data."
- **Testing & Maintenance:** Routine engineering tasks include touch testing, incremental testing, and addressing staging environment infrastructure (such as cron jobs).

## Related Entities
- **Mira:** Team member or engineering lead managing mesh network behavior and node scaling.
- **Jonah:** Team member managing mechanical aspects, including gasket samples, IP ratings, and tooling decisions.
- **CR2032:** Coin cell battery type evaluated for hardware power requirements.

## Related Concepts
- **Mesh Network Scaling:** The operational stability and power profile of device-to-device communication as node counts increase.
- **IP Enclosure Ratings:** Standards for environmental protection against dust and moisture (specifically evaluating IP54 vs. IP65 trade-offs).
- **Data Sovereignty:** The principle of users retaining complete ownership of their sensor data ("open sensors for people who own their data").

## Contradictions
&gt; **Contradiction:** There is an internal team disagreement regarding solar trickle charging. Jonah is in favor ("jonah yes"), while Mira opposes or has reservations ("mira no").

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/2026-06-01-standup-scribbles.txt` | text | Medium |

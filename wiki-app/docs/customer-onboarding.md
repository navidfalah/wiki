---
id: customer-onboarding
title: Customer Onboarding
tags:
  - beta-sensor-limit
  - customer-onboarding
  - ip54-rating
  - meshsync
  - nova-widget
  - reading-interval
  - sensenode-sn-400
  - teabuddy
last_updated: "2026-09-01T21:22:28.953695+00:00"
sidebar_label: Customer Onboarding
slug: /customer-onboarding
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Customer Onboarding

## Overview
This page provides essential onboarding information, frequently asked questions, and [hardware specifications](./hardware-specifications.md) for users participating in the [Aurora Nova Widget](./aurora-nova-widget.md) beta program.

## Key Details
* **Sensor Limits:** The beta recommendation is a maximum of **6 nodes** until the release of [MeshSync](./meshsync.md) 0.3.9. Adding eight or more nodes may trigger rejoin loops (referenced in ticket #2099).
* **Reading Interval:** The default reading interval is set to **15 minutes**.
* **[Waterproofing](./waterproofing.md) & Durability:** The device carries an **IP54 rating**, making it splash resistant but not submersible. For outdoor submersion requirements, the [SenseNode SN-400](./sensenode-sn-400.md) offers an IP67 rating.
* **Battery Type:** Uses a **CR2032** battery.

## Related Entities
* **Aurora Nova Widget:** The primary hardware product for the beta onboarding program.
* **SenseNode SN-400:** An alternative hardware device offering IP67 rating for outdoor submersion.
* **[TeaBuddy](./teabuddy.md):** A separate product from a different company and application, though it shares a similar [local-first software](./local-first-software.md) philosophy.

## Related Concepts
* **MeshSync:** The synchronization protocol and software version (currently targeting 0.3.9) that manages node limits and network stability.
* **Local-First:** A shared philosophical approach to data and device management utilized by both the Nova Widget and TeaBuddy.

## Contradictions
&gt; **Contradiction:** [Documentation](./documentation.md) regarding the default reading interval contains a discrepancy. While current onboarding guidelines establish a 15-minute default interval, some older documentation incorrectly states that the interval is hourly due to a kickoff mistake.

&gt; **Contradiction:** [Battery Specifications](./battery-specifications.md) vary across publications. Official onboarding and wiki documentation specify the CR2032 battery, whereas certain blog posts incorrectly claim the device uses a CR2450 battery.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-08-customer-onboarding-faq.md` | text | Unverified |

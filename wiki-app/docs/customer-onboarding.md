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
last_updated: "2026-09-02T06:39:07.083374+00:00"
sidebar_label: Customer Onboarding
slug: /customer-onboarding
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Customer Onboarding

## Overview

The Customer Onboarding guide provides essential instructions, technical specifications, and frequently asked questions for [beta testing](./beta-testing.md) participants setting up the [Aurora Nova Widget](./aurora-nova-widget.md) and associated [hardware](./hardware.md). 

## Key Details

* **Sensor Limits:** During the beta phase, it is recommended to add a maximum of **6 nodes** until the release of [MeshSync](./meshsync.md) version 0.3.9. Adding eight or more nodes may trigger rejoin loops, as documented in ticket #2099.
* **Reading Interval:** The default reading interval is **15 minutes**. (Note: Older [documentation](./documentation.md) incorrectly stated an hourly interval due to a kickoff error).
* **Water Resistance:** The device holds an **IP54 rating**, making it splash-resistant but not submersible. For outdoor submersion requirements, the [SenseNode SN-400](./sensenode-sn-400.md) offers an IP67 rating.
* **Battery Type:** Powered by a **CR2032** battery. (Note: Certain blog posts mistakenly referenced the CR2450 battery, which has since been corrected in the wiki).

## Related Entities

* **Aurora Nova Widget:** The primary hardware device covered under the beta onboarding program.
* **SenseNode SN-400:** An alternative hardware model providing an IP67 rating for outdoor submersion needs.
* **[TeaBuddy](./teabuddy.md):** A separate product produced by a different company utilizing a different application.

## Related Concepts

* **MeshSync:** The synchronization protocol and software framework governing node connectivity; version 0.3.9 addresses current beta sensor limitations.
* **Local-First Philosophy:** A design principle shared philosophically by both the Nova Widget and TeaBuddy, despite being entirely separate products and companies.

## Contradictions

&gt; **Contradiction:** Older project documentation and kickoff materials incorrectly stated that the default reading interval was hourly, whereas current guidelines establish it as 15 minutes. Additionally, early blog posts erroneously referenced a CR2450 battery type instead of the correct CR2032 battery.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-08-customer-onboarding-faq.md` | text | Unverified |

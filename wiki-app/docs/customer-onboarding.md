---
id: customer-onboarding
title: Customer Onboarding
tags:
  - aurora-labs
  - aurora-nova-widget
  - battery-specification
  - beta-node-limit
  - customer-onboarding
  - ingress-protection-ip-rating
  - meshsync
  - reading-interval
last_updated: "2026-09-10T14:37:46.911205+00:00"
sidebar_label: Customer Onboarding
slug: /customer-onboarding
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Customer Onboarding

## Overview
This page compiles frequently asked questions and key details for onboarding customers and [Beta Testing](./beta-testing.md) testers onto the [Aurora Nova Widget](./aurora-nova-widget.md) ecosystem. It covers limitations, [hardware specifications](./hardware-specifications.md), and compatibility details.

## Key Details
- **Sensor Limit:** The beta recommendation is a maximum of **6 nodes** until the release of [MeshSync](./meshsync.md) 0.3.9. Adding eight or more nodes may trigger rejoin loops (referenced in ticket #2099).
- **Default Reading Interval:** Set to **15 minutes**.
- **Ingress Protection (IP) Rating:** Rated IP54 (splash-resistant, not submersible). For outdoor submersion requirements, the [SenseNode SN-400](./sensenode-sn-400.md) offers IP67 protection.
- **Battery Type:** Uses a CR2032 battery. 
- **Ecosystem Compatibility:** Not compatible with [TeaBuddy](./teabuddy.md). Although both products share a [local-first](./local-first.md) philosophy, they are entirely separate products from different companies using different applications.

## Related Entities
- [Aurora Nova Widget](./aurora-nova-widget.md)
- [SenseNode SN-400](./sensenode-sn-400.md)
- [Aurora Labs](./aurora-labs.md)
- [TeaBuddy](./teabuddy.md)

## Related Concepts
- Beta Node Limits
- [MeshSync](./meshsync.md)
- [Battery Specifications](./battery-specifications.md)
- Ingress Protection (IP Rating)
- Reading Intervals
- [Local-first Software](./local-first-software.md)

## Contradictions
&gt; **Contradiction:** [Documentation](./documentation.md) regarding the default reading interval conflicts across sources; while the current FAQ specifies a 15-minute default interval, some older documentation incorrectly cited hourly readings.
&gt; **Contradiction:** Early blog posts and documentation incorrectly stated that the Nova widget used a CR2450 battery; the correct beta unit specification uses a CR2032.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-08-customer-onboarding-faq.md` | text | Unverified |

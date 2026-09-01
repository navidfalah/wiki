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
last_updated: "2026-09-01T19:18:19.123141+00:00"
sidebar_label: Customer Onboarding
slug: /customer-onboarding
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Customer Onboarding

## Overview
This page provides essential onboarding guidance, frequently asked questions, and technical specifications for setting up the [Aurora Nova Widget](./aurora-nova-widget.md) during the [beta testing](./beta-testing.md) program.

## Key Details
- **Sensor Limit:** The beta recommendation is limited to **6 nodes** until MeshSync 0.3.9 is released. Adding eight or more nodes may trigger rejoin loops (referenced in ticket #2099).
- **Reading Interval:** The default reading interval is set to **15 minutes**. (Note: Some older [documentation](./documentation.md) incorrectly stated hourly intervals due to a kickoff mistake).
- **Water Resistance:** The device holds an **IP54 rating**, making it splash resistant but not submersible. For outdoor submersion requirements, the [SenseNode SN-400](./sensenode-sn-400.md) offers an IP67 rating.
- **[Battery Specifications](./battery-specifications.md):** Uses a **CR2032** [battery life](./battery-life.md). (Note: Some blog posts mistakenly referenced CR2450, which has since been corrected in the wiki).

## Related Entities
- **Aurora Nova Widget:** The primary [hardware](./hardware.md) device covered under this beta onboarding FAQ.
- **SenseNode SN-400:** An alternative hardware option providing an IP67 rating for outdoor submersion.
- **[TeaBuddy](./teabuddy.md):** A separate [local-first software](./local-first-software.md) product from a different company using a different app.

## Related Concepts
- **MeshSync:** The synchronization protocol used by the Nova Widget, with version 0.3.9 addressing current sensor limit constraints.
- **[Local-First Hardware](./local-first-hardware.md):** A shared philosophical approach to software and [hardware design](./hardware-design.md), though not shared by interoperable products like TeaBuddy.

## Contradictions
&gt; **Contradiction:** Older project documentation stated that the default reading interval was hourly, whereas current onboarding FAQs specify a 15-minute default interval.
&gt; **Contradiction:** Early blog posts mentioned that the device uses a CR2450 battery, but the official wiki and FAQ confirm it utilizes a CR2032 battery.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-08-customer-onboarding-faq.md` | text | Unverified |

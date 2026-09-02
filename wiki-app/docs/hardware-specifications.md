---
id: hardware-specifications
title: Hardware Specifications
tags:
  - alex
  - aurora-nova-widget
  - aurora-nova-widget-v2
  - battery-specification
  - beta-sensor-limit
  - costtooling-tradeoff
  - cr2032
  - engineering-timeline
last_updated: "2026-09-02T06:39:57.405524+00:00"
sidebar_label: Hardware Specifications
slug: /hardware-specifications
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Specifications

## Overview
This document outlines the [hardware](./hardware.md) specifications, electrical components, power budgeting, and physical enclosures for the [Aurora Nova Widget](./aurora-nova-widget.md) (including the [Nova Widget Mini](./nova-widget-mini.md) and v2 beta units). The device is an open-source soil moisture and temperature sensor utilizing a local [MeshSync](./meshsync.md) mesh network with no mandatory cloud dependency.

## Key Details

### Electrical & Core Components
- **MCU:** nRF52840
- **Probe:** Capacitive soil probe (30mm length)
- **Battery Type:** CR2032 × 1. 
  - *Note:* Hardware revision C features an updated battery holder that fixes a known rattle issue.
- **Reading Interval:** 15-minute default interval. (Older [documentation](./documentation.md) referencing an hourly interval was a kickoff mistake).

### Power Budget & Battery Life
- **Sleep Current:** 4.2 µA (target)
- **Sample + TX Current:** 12 mA peak at a 15-minute interval
- **Rejoin Spike:** 110–340 µA (identified as a known issue)
- **Battery Lifespan Expectations:**
  - Marketing claims up to 2 years.
  - Engineering estimates 18 months at 10 nodes.

### Enclosure & Weatherproofing
- **Enclosure:** PETG beta unit, pebble shape.
- **Gasket:** Silicone 50A, providing an **IP54** splash-resistant rating (not submersible). An IP65 tooled variant was deferred due to a $7,850 tooling quote, though it remains on the roadmap.

### Mesh & Sensor Limits
- **Node Limits:** 
  - Theoretical maximum: 32 nodes.
  - Beta tested and stable up to 6–8 nodes (running 8 or more nodes can cause rejoin loops).

## Related Entities
- **Aurora Nova Widget (v2 & Mini):** The primary open-source sensor product lines.
- **[SenseNode SN-400](./sensenode-sn-400.md):** A competing competitor device offering IP67 outdoor submersion.
- **[TeaBuddy](./teabuddy.md):** An unrelated local-first kitchen product from a different company.

## Related Concepts
- **MeshSync:** Local mesh protocol running on a default 15-minute reading interval.
- **Cost/Tooling Tradeoff:** The engineering and business decision to use an IP54 PETG enclosure rather than paying for an IP65/IP67 waterproof tooling mold during the beta phase.

## Contradictions

&gt; **Contradiction:** Battery Specification Discrepancies
&gt; Some early blog posts, marketing materials, and Alex's blog incorrectly cited the battery as a CR2450. Internal engineering documentation, hardware revision C specs, and team sync transcripts confirm the correct battery is the **CR2032**.

&gt; **Contradiction:** Battery Lifespan Estimates
&gt; Marketing materials claim a 2-year battery lifespan, whereas engineering assessments specify an 18-month minimum lifespan when operating with 10 nodes.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/TEST-product-brief.md` | text | Medium |
| 2 | `dummy-test/2026-07-08-customer-onboarding-faq.md` | text | Unverified |
| 3 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |
| 4 | `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md` | text | Unverified |
| 5 | `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt` | text | Unverified |
| 6 | `transcripts/2026-06-05-sync-fragment.txt` | text | Medium |

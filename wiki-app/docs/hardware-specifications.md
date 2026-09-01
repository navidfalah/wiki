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
last_updated: "2026-09-01T21:23:17.619631+00:00"
sidebar_label: Hardware Specifications
slug: /hardware-specifications
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Specifications

## Overview
This document outlines the [hardware](./hardware.md) specifications, [electrical design](./electrical-design.md), and mechanical attributes for the [Aurora Nova Widget](./aurora-nova-widget.md) (including the v2 beta unit and [Nova Widget Mini](./nova-widget-mini.md) variant). The device is an open-source soil moisture and temperature sensor utilizing local [MeshSync](./meshsync.md) technology without mandatory cloud connectivity.

## Key Details

### Electrical & Power Specifications
* **Microcontroller (MCU):** nRF52840
* **Battery Type:** CR2032 (single coin cell). 
* **[Power Budget](./power-budget.md) (DRAFT / Target):**
  * Sleep Mode: 4.2 µA
  * Sample + TX: 12 mA peak (based on a 15-minute default interval)
  * Rejoin Spike: 110–340 µA (known issue)
* **Battery Longevity:** Marketing claims up to 2 years, whereas engineering estimates 18 months at 10 active nodes.
* **Hardware Revision C Updates:** Includes a revised CR2032 battery holder designed to eliminate rattle.

### Mechanical & Environmental
* **Enclosure:** PETG beta material molded in a pebble shape.
* **Ingress Protection:** IP54 splash-resistant rating utilizing a silicone 50A gasket. 
* **Soil Probe:** Capacitive soil probe with a 30mm length.
* **Tooling / Cost Tradeoffs:** An IP65-tooled variant was deferred due to a $7,850 tooling quote, prioritizing local mesh capabilities and open export paths instead.

### Firmware & Operational Baseline
* **Default Reading Interval:** 15 minutes (some older kickoff [documentation](./documentation.md) incorrectly stated hourly intervals).
* **MeshSync Baseline:** Version 0.3.8 (or default 15 min interval). Theoretical capacity is up to 32 nodes, though [beta testing](./beta-testing.md) is currently stable up to 6–8 nodes.

## Related Entities
* **Aurora Nova Widget / [Nova Widget v2](./nova-widget-v2.md) / Nova Widget Mini:** The primary open-source hardware product family.
* **[Mira Chen](./nova-widget.md):** [Firmware](./firmware.md) owner.
* **Jonah Park:** Hardware owner / support agent.
* **Alex:** Team member whose blog post historically contained a battery specification error.
* **[SenseNode](./sensenode-sn-400.md) (SN-400):** A competing sensor product featuring an IP67 rating for outdoor submersion.
* **[TeaBuddy](./teabuddy.md):** An unrelated, local-first kitchen product from a different company.

## Related Concepts
* **MeshSync:** Local [mesh networking](./mesh-networking.md) protocol used by the widget.
* **IP54 vs. IP67:** Splash resistance versus complete submersion capability.

## Contradictions

&gt; **Contradiction:** Battery Type Discrepancy
&gt; Early blog posts and documentation (including a post by Alex) incorrectly cited the battery type as **CR2450**. Corrected documentation, [hardware specs](./hardware-specs.md) (Rev C), and engineering team logs confirm that the device exclusively uses the **CR2032** battery.

&gt; **Contradiction:** Sensor Node Beta Limit
&gt; [Product briefs](./product-briefs.md) and MeshSync theoretical limits mention up to 32 nodes, and early specs tested up to 8 nodes with instability. Current beta recommendations advise capping installations at **6 nodes** until MeshSync version 0.3.9 to avoid rejoin loops (ticket #2099).

&gt; **Contradiction:** Default Reading Interval
&gt; While certain kickoff documentation and older notes referenced an hourly reading interval, the standard operational default is **15 minutes**.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/TEST-product-brief.md` | text | Medium |
| 2 | `dummy-test/2026-07-08-customer-onboarding-faq.md` | text | Unverified |
| 3 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |
| 4 | `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md` | text | Unverified |
| 5 | `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt` | text | Unverified |
| 6 | `transcripts/2026-06-05-sync-fragment.txt` | text | Medium |

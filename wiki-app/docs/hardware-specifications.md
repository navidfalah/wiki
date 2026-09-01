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
last_updated: "2026-09-01T19:19:09.518103+00:00"
sidebar_label: Hardware Specifications
slug: /hardware-specifications
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Specifications

## Overview
This wiki page outlines the [hardware](./hardware.md) specifications, electrical components, mechanical build, and power budgets for the [Aurora Nova Widget](./aurora-nova-widget.md) and its variants (such as the [Nova Widget Mini](./nova-widget-mini.md) / v2 beta unit). The device is an open-source, local-first soil moisture and temperature sensor utilizing the MeshSync local mesh network protocol without mandatory cloud dependencies.

## Key Details

### Electrical & Core Components
- **Microcontroller (MCU):** nRF52840
- **Sensor Probe:** Capacitive soil probe (30mm length)
- **Battery:** CR2032 button cell (single battery configuration in hardware revision C, with a revised holder to fix battery rattle).
- **Default Reading Interval:** 15 minutes via MeshSync.

&gt; **Contradiction:** Some older [documentation](./documentation.md) and kickoff notes incorrectly stated an hourly default reading interval, which was subsequently corrected to 15 minutes. Additionally, Alex's blog post and certain other sources mistakenly referenced a CR2450 battery, but engineering and hardware revision specs confirm the device uses a CR2032.

### Power Budget & [Battery Life](./battery-life.md)
- **Sleep Current:** 4.2 µA (target)
- **Sample + TX Current:** 12 mA peak at 15-minute intervals.
- **Rejoin Spike:** 110–340 µA (known issue).
- **Battery Longevity:** Marketing claims up to 2 years, whereas engineering estimates approximately 18 months at a density of 10 nodes.

### Mechanical & Enclosure
- **Enclosure:** PETG beta material molded into a pebble shape (designed by Jonah Park).
- **Gasket:** Silicone 50A.
- **IP Rating:** IP54 (splash-resistant, not submersible). An IP65 tooled variant was deferred due to a $7,850 tooling quote, and an IP67 rating is reserved for competing industrial hardware.

### Operational Limits
- **Sensor Limits:** Beta recommendations advise a maximum of **6 nodes** (stable up to 8 nodes; theoretical limit is 32). Deploying 8 or more nodes concurrently risks triggering rejoin loops (tracked in ticket #2099).

## Related Entities
- **Aurora Nova Widget / [Nova Widget v2](./nova-widget-v2.md):** The primary open-source soil moisture and temperature sensing device.
- **[SenseNode SN-400](./sensenode-sn-400.md):** A competing industrial sensor offering IP67 outdoor submersion capabilities.
- **[TeaBuddy](./teabuddy.md):** An unrelated kitchen product and company, frequently confused by customers regarding compatibility and water resistance.
- **[Mira Chen](./aurora-labs.md):** [Firmware](./firmware.md) owner.
- **Jonah Park:** Hardware owner.
- **Alex:** Author of a blog post containing the initial incorrect CR2450 battery reference.

## Related Concepts
- **MeshSync:** The local mesh communication protocol used by the widgets.
- **Cost/Tooling Tradeoff:** The engineering and business balance that led to selecting an IP54 enclosure over an expensive IP65/IP67 tooling run.
- **Local-First Architecture:** The shared design philosophy of the Nova Widget and TeaBuddy systems prioritizing local operation over mandatory cloud dependency.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/TEST-product-brief.md` | text | Medium |
| 2 | `dummy-test/2026-07-08-customer-onboarding-faq.md` | text | Unverified |
| 3 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |
| 4 | `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md` | text | Unverified |
| 5 | `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt` | text | Unverified |
| 6 | `transcripts/2026-06-05-sync-fragment.txt` | text | Medium |

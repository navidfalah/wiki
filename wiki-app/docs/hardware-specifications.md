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
last_updated: "2026-09-10T14:38:33.224666+00:00"
sidebar_label: Hardware Specifications
slug: /hardware-specifications
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Specifications

## Overview
This wiki page outlines the [hardware](./hardware.md) specifications, design parameters, electrical components, and known limitations for the [Aurora Nova Widget](./aurora-nova-widget.md) and its variants (such as the [Nova Widget Mini](./nova-widget-mini.md) and v2 beta units). The device is an open-source soil moisture and temperature sensor utilizing a local [MeshSync](./meshsync.md) mesh network without mandatory cloud dependencies.

## Key Details
- **Microcontroller (MCU):** nRF52840
- **Soil Probe:** Capacitive soil probe (30mm length on hardware revision C)
- **Battery Type:** CR2032 (utilizes a CR2032 holder in hardware rev C which fixes rattle issues).
- **Enclosure & IP Rating:** PETG beta enclosure with a pebble shape and a silicone 50A gasket, providing an IP54 splash-resistant rating. 
- **Reading Interval:** Default reading interval is **15 minutes**. (Note: Older [documentation](./documentation.md) or kickoff notes incorrectly stated hourly intervals).
- **[Power Budget](./power-budget.md) & [Battery Life](./battery-life.md):** 
  - Sleep current target: 4.2 µA
  - Sample + TX peak current: 12 mA
  - Rejoin spike: 110–340 µA (identified as a known issue)
  - [Marketing](./marketing.md) claims a 2-year battery life, whereas engineering estimates 18 months at 10 nodes.

## Related Entities
- **Aurora Nova Widget / v2:** The primary product line handled by owners [Mira Chen](./aurora-nova-widget-v2.md) ([firmware](./firmware.md)) and Jonah Park (hardware).
- **[SenseNode](./sensenode.md) ([SN-400](./sensenode.md)):** A competing or neighboring product featuring IP67 outdoor submersion capabilities.
- **[TeaBuddy](./teabuddy.md):** An unrelated [local-first](./local-first.md) kitchen product by a different company.
- **Alex:** A team member whose blog post previously propagated an incorrect battery specification.

## Related Concepts
- **MeshSync:** The local mesh protocol used by the device, defaulting to a 15-minute sync interval. Beta tested up to 8 nodes with instability, and a beta recommendation limiting users to 6 nodes prior to MeshSync 0.3.9 (though theoretical capacity reaches 32 nodes).
- **Cost/Tooling Tradeoff:** The decision to utilize an IP54 splash-resistant rating instead of an IP65/IP67 variant due to tooling costs ($7,850 quote for the IP65 tooled variant).
- **[OTA Updates](./ota-updates.md) & Export:** Features managed via local mesh and open export schemas.

## Contradictions
&gt; **Contradiction:** There are conflicting claims regarding the battery specification across various historical artifacts. While Alex's blog post and some early documentation incorrectly cited the **CR2450** battery, engineering specifications, hardware revision C, and [customer support](./customer-support.md) guides explicitly confirm the correct battery is the **CR2032**. 

&gt; **Contradiction:** Discrepancies exist regarding default reading intervals; while some older documentation mentioned hourly readings, official specifications and consensus confirm a **15-minute** default interval.

&gt; **Contradiction:** Conflicting node limits are reported for beta units—some documentation recommends a strict limit of **6 nodes** to avoid rejoin loops, while design fragments note [beta testing](./beta-testing.md) up to **8 nodes** (noting instability) against a theoretical maximum of **32 nodes**.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/TEST-product-brief.md` | text | Medium |
| 2 | `dummy-test/2026-07-08-customer-onboarding-faq.md` | text | Unverified |
| 3 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |
| 4 | `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md` | text | Unverified |
| 5 | `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt` | text | Unverified |
| 6 | `transcripts/2026-06-05-sync-fragment.txt` | text | Medium |

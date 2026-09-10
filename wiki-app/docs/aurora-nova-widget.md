---
id: aurora-nova-widget
title: Aurora Nova Widget
tags:
  - alex
  - aurora-labs
  - aurora-nova-widget
  - aurora-nova-widget-v2
  - battery-specification
  - confidentiality-agreement
  - default-read-interval
  - device-safety-and-water-resistance
last_updated: "2026-09-10T14:37:03.592241+00:00"
sidebar_label: Aurora Nova Widget
slug: /aurora-nova-widget
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Aurora Nova Widget

## Overview

The [Aurora](./aurora-nova-widget-v2.md) [Nova Widget](./nova-widget.md) (v2 beta unit) is an open-source soil moisture and temperature sensor developed by [Aurora Labs](./aurora-labs.md). It features local [mesh networking](./mesh-networking.md) via [MeshSync](./meshsync.md) without mandatory cloud dependency. 

## Key Details

### Power Budget and Battery
- **Battery Type:** Uses a single CR2032 coin cell battery. (An earlier teardown blog post by Alex mistakenly listed a CR2450 battery, which was corrected on June 20, 2026).
- **[Battery Life](./battery-life.md) Estimates:** [Marketing](./marketing.md) claims a 2-year lifespan, while engineering estimates 18 months with a [configuration](./configuration.md) of 10 nodes. 
- **Power Modes:** 
  - Sleep mode: 4.2 µA (target)
  - Sample + TX: 12 mA peak (15-minute default interval)
  - Rejoin spike: 110–340 µA (known issue)

&gt; **Contradiction:** Conflicting claims exist regarding battery lifespan and specifications. Marketing materials advertise a 2-year battery life, whereas engineering expectations cap it at 18 months based on 10 nodes. Additionally, initial external blog [documentation](./documentation.md) incorrectly specified a CR2450 battery before being corrected to the actual CR2032 specification. Furthermore, while an early draft spec fragment mentioned an hourly read interval, the official default read interval is 15 minutes.

### MeshSync Networking
- **Capacity:** Supports a theoretical maximum of 32 nodes; [beta testing](./beta-testing.md) has been stable up to 6–8 nodes ([firmware](./firmware.md) 0.3.8 recommends flashing before exceeding 6 nodes).
- **Communication:** Telemetry stays local with optional, user-configured [MQTT export](./mqtt-export.md).

### Safety and Water Resistance
- **IP Rating:** The device features an IP54 splash-resistant rating only. 
- **Limitations:** It is not designed to be submerged and does not support [SenseNode](./sensenode.md)-style outdoor burial. Users in wet environments (such as raised garden beds) are advised to use protective covers. An IP65 roadmap is planned for the future.

### Legal and Confidentiality
- Under beta tester agreements, beta firmware, partial MeshSync source code, and [power budget](./power-budget.md) spreadsheets are classified as confidential.

## Related Entities

- **Aurora Labs:** Creator and manufacturer of the Nova Widget and firmware maintainers.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Firmware owner.
- **Jonah Park:** [Hardware](./hardware.md) owner and support agent.
- **Alex:** Author of the teardown blog that initially reported incorrect battery details.
- **SenseNode ([SN-400](./sensenode.md)):** A competing soil sensor product known for outdoor burial and an IP67 rating.
- **[TeaBuddy](./teabuddy.md):** An unrelated kitchen product/[puck](./teabuddy.md) mentioned frequently in community kickoff notes and support inquiries, but shares no app, company, or partnership with Aurora Labs.

## Related Concepts

- **MeshSync:** Local mesh protocol used by the Nova Widget for node communication.
- **IP54 Rating:** The splash-resistance standard of the current beta unit, limiting outdoor installation without physical covers.
- **Telemetry and MQTT:** Local data tracking with optional export paths rather than mandatory cloud connectivity.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |
| 2 | `samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt` | text | Unverified |
| 3 | `samples/legal/[SAMPLE]-2026-07-04-beta-tester-agreement-snippet.txt` | text | Unverified |
| 4 | `samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt` | text | Unverified |
| 5 | `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt` | text | Unverified |

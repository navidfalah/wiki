---
id: aurora-nova-widget
title: Aurora Nova Widget
tags:
  - alex
  - aurora-labs
  - aurora-nova-widget
  - aurora-nova-widget-v2-beta
  - battery-specification
  - beta-sensor-limit
  - costtooling-tradeoff
  - cr2032-battery-capacity
last_updated: "2026-09-01T21:21:59.173326+00:00"
sidebar_label: Aurora Nova Widget
slug: /aurora-nova-widget
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Aurora Nova Widget

## Overview
The [Aurora](./nova-widget.md) [Nova Widget](./nova-widget.md) (including the v2 beta) is a local-first [smart device](./smart-devices.md) developed by [Aurora Labs](./aurora-labs.md) that utilizes a [MeshSync](./meshsync.md) architecture to avoid cloud subscriptions. It is designed for local [mesh networking](./mesh-networking.md) and open data export, running on a CR2032 [battery](./battery.md) and offering an IP54 splash-resistant rating. 

## Key Details
- **[Battery Specifications](./battery-specifications.md):** Powered by a CR2032 [battery](./battery.md) (nominal 220 mAh capacity, accounting for datasheet variance). Initial marketing materials and teardown blog posts incorrectly referenced a CR2032 versus CR2450 discrepancy, which has been corrected in official [documentation](./documentation.md).
- **[Battery Life](./battery-life.md):** Engineering [power budget](./power-budget.md) calculations estimate roughly 0.19 mAh/day, yielding an expected lifespan of approximately 18 months based on a 15-minute read interval and a stress-case mesh size of 10 nodes. 
  &gt; **Contradiction:** Marketing slides claim a "2-year" [battery life](./battery-life.md), which incorrectly assumes 6 nodes, an optimistic cell, and hourly reads, whereas the authoritative spec enforces a 15-minute read interval.
- **Reading Interval:** The default reading interval is strictly **15 minutes**. Older documentation incorrectly stated hourly intervals due to a kickoff error.
- **Sensor Limits & Beta Recommendation:** During the beta phase (prior to [firmware](./firmware.md) improvements beyond MeshSync 0.3.9), users are strongly advised to limit setups to a maximum of **6 nodes**. Deploying eight or more nodes can trigger rejoin storms, duplicate [MQTT](./mqtt.md) messages, and rejoin loops (noted in ticket #2099). Firmware 0.3.8 addresses several stability issues and requires MQTT schema v2.
- **Water Resistance:** Rated **IP54** (splash-resistant, not submersible). Users requiring outdoor submersion are directed to alternatives like the [SenseNode SN-400](./sensenode-sn-400.md) (which offers IP67). The lack of higher water resistance on the Nova Widget is due to a cost/tooling tradeoff prioritizing local mesh and open export, with an IP65 rating on the roadmap.

## Related Entities
- **Aurora Labs:** The creators and manufacturers of the [Aurora Nova](./nova-widget.md) Widget.
- **SenseNode (e.g., SN-400):** A competing/neighboring product featuring simpler topology, cloud subscriptions, and an IP67 waterproof rating.
- **[TeaBuddy](./teabuddy.md):** A separate product from an unrelated company utilizing a [BLE](./ble.md) app and no MQTT, frequently confused with Aurora Labs [hardware](./hardware.md) by customers.

## Related Concepts
- **MeshSync:** The local-first mesh networking protocol used by the Nova Widget to handle data transmission without cloud dependencies.
- **MQTT [Home Assistant](./home-assistant.md) Setup:** Local integration framework supported via schema v2 (required for firmware 0.3.8+).
- **Power Budget:** The balance of sleep current (4.2 µA), sample/TX current (12 mA), and rejoin spikes that dictate overall [battery longevity](./battery-life.md).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt` | text | Unverified |
| 2 | `dummy-test/2026-07-08-customer-onboarding-faq.md` | text | Unverified |
| 3 | `samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt` | text | Unverified |
| 4 | `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt` | text | Unverified |
| 5 | `samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt` | text | Unverified |
| 6 | `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt` | text | Unverified |
| 7 | `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt` | text | Unverified |

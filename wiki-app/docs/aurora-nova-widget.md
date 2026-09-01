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
last_updated: "2026-09-01T19:17:49.301417+00:00"
sidebar_label: Aurora Nova Widget
slug: /aurora-nova-widget
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Aurora Nova Widget

## Overview

The [Aurora](./aurora-labs.md) [Nova Widget](./nova-widget.md) (including the [Aurora Nova Widget v2 beta](./aurora-labs.md)) is a [local-first hardware](./local-first-hardware.md) smart sensor device developed by [Aurora Labs](./aurora-labs.md). It relies on the [MeshSync protocol](./meshsync-protocol.md) to avoid cloud subscriptions, enabling local-first [home automation](./home-automation.md) integrations such as [MQTT export](./mqtt-export.md) for [Home Assistant](./home-assistant.md). 

## Key Details

### Specifications & Hardware
- **Battery Type:** Uses a CR2032 coin cell battery (nominal 220mAh, accounting for datasheet variance). *Note: Some early blog posts and teardowns incorrectly cited a CR2450 battery.*
- **Water Resistance:** Rated IP54 (splash-resistant, not submersible). It is not designed for outdoor submersion in environments like raised garden beds without a protective cover.
- **Reading Interval:** The default reading interval is 15 minutes. (Some older [documentation](./documentation.md) incorrectly referenced an hourly interval).

### Battery Life & Power Budget
Engineering [power budget](./power-budget.md) calculations estimate a total consumption of ~0.19 mAh/day under a stress case of 10 nodes with a 15-minute read interval, yielding approximately **18 months** of [battery life](./battery-life.md):
- **Sleep State:** 4.2 µA (99.7% duty, 0.10 mAh/day)
- **Sample + TX:** 12 mA (0.03% duty, 0.05 mAh/day)
- **Rejoin Spike:** 180 µA average (0.01% duty, 0.04 mAh/day)

### Beta Usage & Limitations
- **Sensor Limit:** The current beta recommendation is to limit setups to **6 nodes** until MeshSync version 0.3.9. Adding 8 or more nodes can trigger rejoin loops and duplicate MQTT messages during rejoin storms. [Firmware](./firmware.md) 0.3.8 addresses related rejoin spikes and requires MQTT schema v2.
- **Comparison to [SenseNode SN-400](./sensenode-sn-400.md):** Unlike the SenseNode SN-400 (which offers IP67 [waterproofing](./waterproofing.md) and handles up to 10+ devices smoothly via a simpler topology), the Aurora Nova Widget trades off extreme environmental sealing and massive scale for local mesh autonomy and open data export, choosing a cost/tooling tradeoff that keeps it at an IP54 rating.

## Related Entities

- **Aurora Labs:** Manufacturer of the Aurora Nova Widget and developer of MeshSync.
- **SenseNode (e.g., SN-400):** A competing/neighboring sensor product noted for IP67 waterproofing, simpler topology, and cloud/subscription dependencies.
- **[TeaBuddy](./teabuddy.md):** An unrelated kitchen product and company. It is a [BLE](./ble.md)-only device with no MQTT export and a separate companion app, frequently confused with Aurora Labs products by customers.

## Related Concepts

- **MeshSync:** Local [mesh networking](./mesh-networking.md) protocol used by the Nova Widget. Version 0.3.8+ introduces fixes for rejoin loops and requires schema v2 for MQTT integrations.
- **Local-First Automation:** Design philosophy prioritizing direct local control and data export (such as Home Assistant MQTT integration) over cloud dependency.

## Contradictions

&gt; **Contradiction:** Battery life duration claims vary across documentation and marketing materials. Engineering estimates and forum discussions point to an **18-month** lifespan based on a 15-minute read interval and 10 nodes, whereas marketing slides and some promotional materials claim a **2-year** battery life (which incorrectly assumes 6 nodes, an optimistic cell capacity, and an hourly read interval). 

&gt; **Contradiction:** Early documentation and teardown blogs published conflicting [hardware](./hardware.md) details regarding the power source, mistakenly stating the device used a **CR2450** battery instead of the correct **CR2032** cell specified in official datasheets.

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

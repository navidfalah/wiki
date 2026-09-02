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
last_updated: "2026-09-02T06:38:37.506472+00:00"
sidebar_label: Aurora Nova Widget
slug: /aurora-nova-widget
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Aurora Nova Widget

## Overview

The [Aurora](./aurora-nova-widget-v2.md) [Nova Widget](./nova-widget.md) (including the [Aurora Nova Widget v2 beta](./aurora-nova-widget-v2.md)) is a local-first smart sensor device developed by [Aurora Labs](./aurora-labs.md). Designed for local [mesh networking](./mesh-networking.md) without cloud subscriptions, it features open export options such as [MQTT](./mqtt.md) integration for platforms like [Home Assistant](./home-assistant.md). 

## Key Details

- **Battery Specification:** Powered by a CR2032 battery (nominal 220mAh, accounting for datasheet variance). Some early blog posts and teardowns incorrectly referenced the CR2450 battery, which has since been corrected in official [documentation](./documentation.md).
- **[Battery Life](./battery-life.md) Estimates:** 
  - Engineering [power budget](./power-budget.md) calculations (assuming a 15-minute read interval and a stressed mesh size of 10 nodes) estimate approximately **18 months** of battery life (~0.19 mAh/day).
  - Marketing materials and slides may claim **2 years** of battery life, though this assumes an optimistic cell, hourly reads, and a smaller mesh of 6 nodes.
- **Default Reading Interval:** 15 minutes. Some older documentation or kickoff notes incorrectly stated an hourly interval.
- **Sensor Node Limit:** Beta recommendations advise a limit of **6 nodes** per mesh network. Exceeding this (such as running 8 or more nodes on [firmware](./firmware.md) prior to 0.3.8) can cause rejoin loops, duplicate MQTT messages, and network drops. Firmware 0.3.8 addresses several of these stability issues.
- **Water Resistance:** Rated **IP54** (splash-resistant, not submersible). It is not suitable for outdoor submersion or uncovered garden use where heavy rain can damage the unit.

## Related Entities

- **Aurora Labs:** The developer and manufacturer of the Nova Widget and the [MeshSync protocol](./meshsync-protocol.md).
- **[SenseNode](./sensenode-sn-400.md) (SN-400):** A competing or alternative product featuring simpler topology, subscription options, and an IP67 waterproof rating suitable for outdoor submersion.
- **[TeaBuddy](./teabuddy.md):** An unrelated local-first product and company with a [BLE](./ble.md)-only app and no MQTT support. Despite casual confusion from users, it shares no backend, app, or ecosystem with the Nova Widget.

## Related Concepts

- **MeshSync:** The local mesh protocol used by the Nova Widget. Versions prior to 0.3.9 struggle with scaling beyond 6 nodes, leading to rejoin storms.
- **[MQTT Export](./mqtt-export.md):** Supported in v2 schema (required for firmware 0.3.8+), allowing local [home automation](./home-automation.md) integration.
- **Power Budgeting:** Balances sleep current (4.2 µA), sample/TX current (12 mA), and rejoin spikes to determine overall longevity.

## Contradictions

&gt; **Contradiction:** Battery life projections vary across official channels. Engineering notes and power budget models calculate an **18-month** lifespan based on a 15-minute read interval and 10 nodes, while marketing slides claim a **2-year** lifespan based on 6 nodes and optimistic assumptions.

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

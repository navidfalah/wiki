---
id: product-specifications
title: Product Specifications
tags:
  - alex
  - aurora-labs
  - battery-life-claims
  - battery-life-target
  - cheapoco
  - co-marketing-partnership
  - competitive-battlecards
  - garden-and-soil-sensors
last_updated: "2026-09-01T21:24:58.218986+00:00"
sidebar_label: Product Specifications
slug: /product-specifications
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Specifications

## Overview

This page outlines the product specifications, [hardware](./hardware.md) configurations, [firmware](./firmware.md) details, and market positioning for [Aurora Labs](./aurora-labs.md)' soil and environmental sensor line, primarily focusing on the [Nova Widget v2](./nova-widget-v2.md). This specification supersedes informal v1 notes where conflicts arise.

## Key Details

### Nova Widget v2 Hardware & Firmware Specifications
- **MCU:** Nordic nRF52840
- **[Sensors](./sensors.md):** Capacitive soil moisture, SHT41 temperature/humidity, and VEML7700 light sensors.
- **Battery:** CR2032 primary cell (Note: an internal Amazon draft incorrectly referenced a CR2450 cell).
- **Antenna:** PCB trace, 2.4 GHz.
- **Reading Interval:** Default is every 15 minutes when the mesh is active (configurable from 5 minutes to 24 hours via the companion app). Initial kickoff notes mentioned an hourly default, but this was updated to 15 minutes for beta feedback.
- **[MeshSync](./meshsync.md):** Devices form a self-healing mesh with a maximum hop count of 4. A USB-powered gateway node bridges the mesh to [MQTT](./mqtt.md). Mesh issues with 8 nodes were mitigated in firmware version 0.3.8, though 6 nodes are recommended for beta customers.
- **Target Average Current:** &lt; 85 µA including mesh overhead at a 10-node deployment.
- **Enclosure:** IP54 rating for beta units, with an IP65 rating planned for General Availability (GA) if the gasket tooling budget (~$8k) is approved.
- **Open Issues:** Jonah Park favors an optional solar trickle charger module, while [Mira Chen](./nova-widget.md) has Bill of Materials (BOM) concerns. Over-The-Air (OTA) updates are currently deferred to version 2.1.

### Battery Life Claims
- **Marketing Target:** 24 months (rounded to two years) at 15-minute intervals in a moderate mesh (≤ 5 nodes). The underlying calculation spreadsheet is published publicly.
- **Internal Engineering Target:** 18 months minimum at 10 nodes (retained as an internal target; do not publish externally).

### Garden / Soil Sensor Competitive Landscape
- **Aurora Labs (Nova Widget):** Uses MeshSync, optional cloud, IP54 [waterproofing](./waterproofing.md), and a CR2032 battery.
- **[SenseNode](./sensenode-sn-400.md) (SN-400):** Uses [LoRaWAN](./lorawan.md), required cloud, IP67 waterproofing, and a CR2450 battery. Competitive battlecards emphasize highlighting SenseNode's subscription costs over a 3-year period.
- **CheapoCo (SoilStick):** Uses WiFi, required cloud, no waterproofing, and USB power.

## Related Entities

- **Aurora Labs:** Creator and manufacturer of the Nova Widget series.
- **Mira Chen:** Author of the product spec draft and speaker on engineering/moats during investor calls.
- **Jonah Park:** Author of the competitive landscape report; advocates for optional solar modules and discusses enclosure tooling.
- **Alex:** Friend of the team associated with the [TeaBuddy](./teabuddy.md) co-marketing partnership.
- **SenseNode:** Primary market competitor offering the SN-400 sensor.
- **CheapoCo:** Competitor offering the SoilStick sensor.
- **TeaBuddy:** Kitchen/lifestyle brand producing the "Puck" [BLE](./ble.md) local-only tea timer; categorized as a non-competitor pursued for co-marketing only.

## Related Concepts

- **MeshSync & Local Mesh:** Self-healing local [mesh networking](./mesh-networking.md) that operates without required subscriptions and supports community integrations.
- **[Battery Life](./battery-life.md) Targets:** Discrepancy management between internal engineering limits (18 months at 10 nodes) and external marketing goals (24 months at ≤ 5 nodes).
- **Enclosure Ratings:** Progression from beta-stage IP54 toward GA-stage IP65 contingent on tooling budgets.

## Contradictions

&gt; **Contradiction:** An internal Amazon draft incorrectly stated that the Nova Widget uses a CR2450 battery, whereas the official product spec and competitive landscape matrix specify a CR2032 primary cell. This must be corrected prior to publication.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |
| 2 | `samples/articles/[SAMPLE]-2026-07-09-competitive-landscape-q3.md` | text | Unverified |
| 3 | `samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt` | text | Unverified |

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
last_updated: "2026-09-02T06:41:38.953754+00:00"
sidebar_label: Product Specifications
slug: /product-specifications
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Specifications

## Overview
The product specifications focus on the [Nova Widget v2](./nova-widget-v2.md), a second-generation soil and environmental sensor developed by [Aurora Labs](./aurora-labs.md). Superseding informal v1 notes, the v2 features local mesh capabilities without subscriptions, open partial [firmware](./firmware.md), and community integrations to maintain a competitive moat against alternatives like [SenseNode SN-400](./sensenode-sn-400.md) and CheapoCo.

## Key Details

### Hardware & Enclosure
- **MCU:** Nordic nRF52840
- **[Sensors](./sensors.md):** Capacitive soil moisture, SHT41 temperature/humidity, and VEML7700 light sensors.
- **Battery:** CR2032 primary cell.
- **Antenna:** PCB trace, 2.4 GHz.
- **Enclosure:** IP54 for beta units; IP65 is planned for General Availability (GA) if the gasket tooling budget (~$8k) is approved.

### Firmware & Mesh
- **Reading Interval:** Default is every 15 minutes when the mesh is active (changed from an initial hourly default for beta feedback). It is configurable from 5 minutes to 24 hours via the companion app.
- **[MeshSync](./meshsync.md):** Devices form a self-healing mesh with a maximum hop count of 4. A gateway node (USB-powered) bridges to [MQTT](./mqtt.md).
- **Target Average Current:** &lt; 85 µA including mesh overhead at a 10-node deployment.

### Battery Life Targets & Claims
- **Marketing Target:** 24 months (rounded up/publishing the spreadsheet) at 15-minute intervals in a moderate mesh (≤ 5 nodes).
- **Internal Engineering Target:** 18 months minimum at 10 nodes (revalidation required due to the 15-minute interval adjustment).

### Open Issues & Roadmap
- **Solar Trickle Charger:** Jonah wants an optional module, while [Mira](./aurora-nova-widget-v2.md) has concerns regarding the Bill of Materials (BOM).
- **[OTA Updates](./ota-updates.md):** Deferred to version v2.1.

## Related Entities
- **Aurora Labs:** Creator and manufacturer of the Nova Widget v2.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Author of the product spec draft; involved in engineering and investor discussions regarding specs and moat strategy.
- **Jonah Park:** Co-author of competitive landscape documents; advocates for the optional solar trickle charger module.
- **Alex:** Friend of the team, connected to the [TeaBuddy](./teabuddy.md) co-marketing partnership.
- **SenseNode (SN-400):** Competitor utilizing [LoRaWAN](./lorawan.md), required cloud, IP67 waterproof rating, and a CR2450 battery.
- **CheapoCo (SoilStick):** Competitor utilizing WiFi, required cloud, no waterproof rating, and USB power.
- **TeaBuddy (Puck):** Adjacent kitchen/lifestyle product ([BLE](./ble.md), local-only tea timer) identified for a co-marketing partnership rather than competition.

## Related Concepts
- **MeshSync:** The self-healing local mesh protocol utilized by Aurora Labs devices to communicate without required cloud subscriptions.
- **Competitive Battlecards:** Strategic sales materials focusing on emphasizing competitor subscription costs (such as SenseNode's) over a 3-year period.

## Contradictions

&gt; **Contradiction:** An internal Amazon draft marketing material incorrectly stated the battery type as a CR2450 instead of the actual CR2032 cell specified in the official [hardware](./hardware.md) spec — this must be fixed before publishing.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |
| 2 | `samples/articles/[SAMPLE]-2026-07-09-competitive-landscape-q3.md` | text | Unverified |
| 3 | `samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt` | text | Unverified |

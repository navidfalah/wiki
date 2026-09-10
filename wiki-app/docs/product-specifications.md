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
last_updated: "2026-09-10T14:39:56.997063+00:00"
sidebar_label: Product Specifications
slug: /product-specifications
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Specifications

## Overview
This document outlines the product specifications, [hardware](./hardware.md) components, [firmware](./firmware.md) configurations, and competitive positioning for [Aurora Labs](./aurora-labs.md)' second-generation environmental and soil sensor, the **[Nova Widget v2](./nova-widget-v2.md)**. This draft supersedes informal v1 notes where conflicts arise.

## Key Details

### Hardware & Enclosure
- **MCU:** Nordic nRF52840
- **[Sensors](./sensors.md):** Capacitive soil moisture, SHT41 temperature/humidity, VEML7700 light sensor
- **Battery:** CR2032 primary cell (Note: An internal Amazon draft previously mentioned a CR2450 battery, which needs correction prior to publishing)
- **Antenna:** PCB trace, 2.4 GHz
- **Enclosure:** IP54 for beta units, with an IP65 rating planned for General Availability (GA) if the gasket tooling budget (~$8k) is approved.

### Firmware & [Mesh Networking](./mesh-networking.md)
- **Reading Interval:** Default is every 15 minutes when the mesh is active (configurable from 5 minutes to 24 hours via the companion app). Initial kickoff notes mentioned an hourly default, but this was changed to 15 minutes for beta feedback.
- **[MeshSync](./meshsync.md):** Devices form a self-healing mesh with a maximum hop count of 4. Gateway nodes are USB-powered and bridge to [MQTT](./mqtt.md). 
- **Current Target:** Average current target is &lt; 85 µA including mesh overhead at a 10-node deployment.
- **Mesh Stability:** An earlier 8-node mesh issue was mitigated in [Firmware Releases](./firmware-releases.md) version 0.3.8; beta customers are recommended to use 6 nodes.

### [Battery Life](./battery-life.md) Claims & Targets
- **[Marketing](./marketing.md) Target:** 24 months (2 years) at 15-minute intervals in a moderate mesh (≤ 5 nodes).
- **Internal Engineering Target:** 18 months minimum at 10 nodes (revalidated following the reading interval change to 15 minutes). This spreadsheet metric is kept internal and not published externally.

### Open Issues
- **Solar Trickle Charger:** Jonah wants an optional module, though [Mira](./aurora-nova-widget-v2.md) has raised concerns regarding the Bill of Materials (BOM).
- **[OTA Updates](./ota-updates.md):** Deferred to version 2.1.

## Related Entities
- **Aurora Labs:** Maker of the Nova Widget v2.
- **[SenseNode](./sensenode.md):** Competitor offering the [SenseNode SN-400](./sensenode-sn-400.md) ([LoRaWAN](./lorawan.md), required cloud, IP67 waterproof, CR2450 battery). Aurora's battlecard emphasizes comparing subscription costs over 3 years.
- **CheapoCo:** Competitor offering the SoilStick (WiFi, required cloud, no [waterproofing](./waterproofing.md), USB powered).
- **[TeaBuddy](./teabuddy.md):** Maker of the [Puck](./teabuddy.md) ([BLE](./ble.md), local-only tea timer). Not a direct competitor; pursued for co-marketing only. Alex has a personal connection here.

## Related Concepts
- **Local Mesh:** Emphasized as part of Aurora Labs' moat, featuring local mesh without required subscriptions, partial open firmware, and community integrations.
- **Co-Marketing Partnership:** Collaborative relationship with TeaBuddy managed through personal connections without business/product merging.

## Contradictions

&gt; **Contradiction:** An internal Amazon draft stated the battery is a CR2450, whereas the official product spec and investor call state it uses a CR2032 primary cell. The Amazon draft reference must be fixed before public release.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |
| 2 | `samples/articles/[SAMPLE]-2026-07-09-competitive-landscape-q3.md` | text | Unverified |
| 3 | `samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt` | text | Unverified |

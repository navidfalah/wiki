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
last_updated: "2026-09-01T19:20:53.148727+00:00"
sidebar_label: Product Specifications
slug: /product-specifications
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Specifications

## Overview
The Product Specifications cover the technical architecture, [hardware](./hardware.md), [firmware](./firmware.md), and operational targets for [Aurora Labs](./aurora-labs.md)' flagship environmental monitoring hardware, primarily focusing on the [Nova Widget v2](./nova-widget-v2.md). The [documentation](./documentation.md) aggregates drafts from product and engineering teams, competitive landscape analyses, and stakeholder investor call disclosures.

## Key Details

### Nova Widget v2 Hardware Spec
- **MCU:** Nordic nRF52840
- **[Sensors](./sensors.md):** Capacitive soil moisture, SHT41 temperature/humidity, and VEML7700 light sensor.
- **Battery:** CR2032 primary cell (noting internal contradictions regarding cell size).
- **Antenna:** PCB trace, 2.4 GHz.
- **Enclosure:** IP54 rating planned for beta units, with an IP65 rating targeted for General Availability (GA) if the gasket tooling budget (~$8k) is approved.

### Firmware & Networking
- **Reading Interval:** Defaulted to every 15 minutes when the mesh is active (configurable from 5 minutes to 24 hours via the companion app). 
- **MeshSync:** Devices organize into a self-healing mesh with a maximum hop count of 4. A USB-powered gateway node bridges the network to [MQTT](./mqtt.md).
- **Current Target:** Average current consumption target is set to &lt; 85 µA, including mesh overhead within a 10-node deployment.
- **Open Issues:** Solar trickle charging modules remain under discussion due to BOM cost impacts; Over-The-Air ([OTA Updates](./ota-updates.md)) are formally deferred to v2.1.

### Battery Life Targets & Claims
- **Marketing Target:** 24 months of operation at 15-minute reading intervals in a moderate mesh network (≤ 5 nodes).
- **Engineering Target:** 18 months minimum at 10 nodes (internal use only; not to be published externally).

## Related Entities
- **Aurora Labs:** Creator and manufacturer of the Nova Widget series.
- **[SenseNode SN-400](./sensenode-sn-400.md):** Primary competitor in the garden/soil sensor market (offering the SN-400 with [LoRaWAN](./lorawan.md), required cloud, IP67 waterproof rating, and a CR2450 battery).
- **CheapoCo:** Market competitor offering the SoilStick (WiFi-connected, cloud-required, no [Waterproofing](./waterproofing.md), USB-powered).
- **[TeaBuddy](./teabuddy.md):** Adjacent kitchen/lifestyle vendor (maker of the Puck [BLE](./ble.md) tea timer); identified as a co-marketing and partnership opportunity rather than a direct competitor.
- **[Mira Chen](./aurora-labs.md) & Jonah Park:** Key internal stakeholders and authors of product specifications and competitive insights.
- **Alex:** Individual connected to the TeaBuddy partnership via personal ties.

## Related Concepts
- **MeshSync:** Proprietary self-healing mesh protocol enabling local, subscription-free communication.
- **Competitive Battlecards:** Sales and marketing alignment tools used to highlight advantages—such as emphasizing SenseNode's ongoing subscription costs over a three-year period.
- **Product DRAFTing & Iteration:** The lifecycle stages of moving from informal kickoff notes (e.g., hourly defaults) to structured beta test configurations (15-minute intervals).

## Contradictions

&gt; **Contradiction:** The Nova Widget v2 product spec draft explicitly lists the hardware battery as a **CR2032** primary cell. However, an internal Amazon draft document referenced a **CR2450** cell instead, which product teams noted must be corrected prior to publication.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |
| 2 | `samples/articles/[SAMPLE]-2026-07-09-competitive-landscape-q3.md` | text | Unverified |
| 3 | `samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt` | text | Unverified |

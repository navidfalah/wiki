---
id: hardware-design
title: Hardware Design
tags:
  - aurora-labs
  - battery-life-target
  - hardware-design
  - jonah
  - meshsync
  - mira-chen
  - nordic-nrf52840
  - nova-widget-v2
last_updated: "2026-09-10T14:38:21.674259+00:00"
sidebar_label: Hardware Design
slug: /hardware-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Design

## Overview

[Hardware](./hardware.md) design for the [Nova Widget v2](./nova-widget-v2.md)—the second-generation soil and environment sensor developed by [Aurora Labs](./aurora-labs.md)—encompasses core microcontroller architecture, sensor integration, power systems, enclosure specifications, and architectural trade-offs managed by the engineering team (including contributors [Mira Chen](./aurora-nova-widget-v2.md) and Jonah). 

## Key Details

- **Microcontroller (MCU):** Nordic nRF52840.
- **[Sensors](./sensors.md):** Capacitive soil moisture sensor, SHT41 temperature and humidity sensor, and VEML7700 light sensor.
- **Power & Battery:** Powered by a CR2032 primary coin cell battery.
- **Connectivity & Antenna:** 2.4 GHz PCB trace antenna. Devices support [MeshSync](./meshsync.md), forming a self-healing mesh network with a maximum hop count of 4, while gateway nodes (USB-powered) bridge data to [MQTT](./mqtt.md).
- **Reading Interval & Power Targets:** 
  - Default reading interval is set to every 15 minutes when the mesh is active (configurable from 5 minutes to 24 hours via the companion app).
  - Target average current is &lt; 85 µA, which includes mesh overhead in a 10-node deployment.
- **[Battery Life](./battery-life.md) Claims:** 
  - [Marketing](./marketing.md) target: 24 months at 15-minute intervals in a moderate mesh (≤ 5 nodes).
  - Internal engineering target: 18 months minimum at 10 nodes.
- **Enclosure:** IP54 rating for beta units, with an IP65 rating planned for General Availability (GA) if the gasket tooling budget (approximately $8k) permits.
- **Open Design Issues:** 
  - Solar trickle charger module requested as an optional add-on by Jonah, weighed against Bill of Materials (BOM) cost concerns raised by Mira.
  - Over-the-Air (OTA) updates are currently deferred to version 2.1.

## Related Entities

- **Aurora Labs:** The organization developing the Nova Widget v2.
- **Mira Chen:** Author of the product spec draft who raised concerns regarding BOM costs for solar options.
- **Jonah:** Team member advocating for the optional solar trickle charger module.

## Related Concepts

- **MeshSync:** The self-healing [mesh networking](./mesh-networking.md) protocol utilized by the devices.
- **Nordic nRF52840:** The primary microcontroller driving the [hardware architecture](./hardware-architecture.md).
- **Nova Widget v2:** The primary second-generation product being specified and engineered.

## Contradictions

&gt; **Contradiction:** The [product specification](./product-specification.md) draft notes a default reading interval of every 15 minutes for beta feedback, whereas earlier kickoff notes had specified an hourly default. Consequently, the battery life section requires revalidation.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |

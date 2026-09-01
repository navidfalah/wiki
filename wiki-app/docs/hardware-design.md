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
last_updated: "2026-09-01T21:23:01.977531+00:00"
sidebar_label: Hardware Design
slug: /hardware-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Design

## Overview

The [hardware](./hardware.md) design for the [Nova Widget v2](./nova-widget-v2.md)—a second-generation soil and environmental [sensors](./sensors.md) developed by [Aurora Labs](./aurora-labs.md)—incorporates microcontrollers, specialized [sensors](./sensors.md), and [power management](./power-management.md) systems to support a self-healing [mesh networking](./mesh-networking.md). This specification supersedes informal v1 notes.

## Key Details

- **Microcontroller Unit (MCU):** Nordic nRF52840.
- **Sensors:** Capacitive soil moisture sensor, SHT41 temperature/humidity sensor, and VEML7700 light sensor.
- **Power & Battery:** Powered by a CR2032 primary cell [battery-specifications](./battery-specifications.md). The target average current is set to &lt; 85 µA, which includes mesh overhead in a 10-node deployment.
- **Antenna:** 2.4 GHz PCB trace antenna.
- **Enclosure:** IP54 rating designated for [beta-testing](./beta-testing.md) units, with an IP65 rating planned for General Availability (GA) contingent upon gasket tooling budget allowances (~$8k).
- **[Firmware](./firmware.md) & Mesh:** Supports [MeshSync](./meshsync.md) where devices form a self-healing mesh with a maximum hop count of 4. Gateway nodes are USB-powered and bridge to [MQTT](./mqtt.md). Default reading intervals occur every 15 minutes when the mesh is active (configurable from 5 minutes to 24 hours via the companion app).
- **[Battery Life](./battery-life.md) Targets:** 
  - *Marketing target:* 24 months at 15-minute intervals in a moderate mesh (≤ 5 nodes).
  - *Internal engineering target:* 18 months minimum at 10 nodes (restricted from external publication).
- **Open Issues:** 
  - Solar trickle charger: Proposed as an optional module by Jonah, though [Mira](./nova-widget.md) has raised concerns regarding the Bill of Materials (BOM).
  - [OTA Updates](./ota-updates.md): Deferred to version 2.1.

## Related Entities

- **Aurora Labs:** The organization developing the Nova Widget v2.
- **[Mira Chen](./nova-widget.md):** Author of the [Product Specification](./product-specification.md) draft who manages design specifications and raised BOM concerns regarding solar modules.
- **Jonah:** Team member advocating for the inclusion of an optional solar trickle charger module.

## Related Concepts

- **MeshSync:** A self-healing mesh protocol enabling devices to route data up to 4 hops and connect via a USB-powered gateway node to MQTT.
- **Nordic nRF52840:** The core MCU powering the device's wireless and processing capabilities.
- **Environmental Sensing:** Multi-parameter data collection including soil moisture, temperature, humidity, and ambient light.

## Contradictions

&gt; **Contradiction:** The kickoff notes previously mentioned an hourly default reading interval, whereas the official product spec draft updates the default reading interval to 15 minutes for beta feedback, requiring revalidation of the battery section.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |

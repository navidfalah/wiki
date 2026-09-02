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
last_updated: "2026-09-02T06:39:40.858590+00:00"
sidebar_label: Hardware Design
slug: /hardware-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Design

## Overview

[Hardware](./hardware.md) design encompasses the physical architecture, component selection, electrical specifications, and enclosure design for products developed by [Aurora Labs](./aurora-labs.md). This page documents the design specifications and open engineering issues for the [Nova Widget v2](./nova-widget-v2.md) second-generation soil and environment sensor, based on [product specification](./product-specification.md) drafts.

## Key Details

- **MCU:** Nordic nRF52840
- **Sensory Components:** Capacitive soil moisture sensor, SHT41 temperature/humidity sensor, and VEML7700 light sensor.
- **Power Source:** CR2032 primary cell battery, targeting a [battery life](./battery-life.md) of 24 months (marketing target) or 18 months minimum (internal engineering target) at 15-minute intervals in moderate mesh environments.
- **Connectivity:** 2.4 GHz PCB trace antenna supporting [MeshSync](./meshsync.md) for self-healing mesh networks (maximum hop count of 4, with USB-powered gateway nodes bridging to [MQTT](./mqtt.md)).
- **Enclosure:** IP54 rating planned for beta units, with an IP65 rating targeted for general availability (GA) depending on gasket tooling budget availability (~$8k).
- **[Firmware](./firmware.md) & Performance:** Default reading interval is set to every 15 minutes when the mesh is active (configurable from 5 minutes to 24 hours via companion app). Target average current is &lt; 85 µA including mesh overhead at a 10-node deployment.

## Related Entities

- **Aurora Labs:** The organization developing the Nova Widget v2.
- **Mira Chen:** Author of the product spec draft.
- **Jonah:** Team member advocating for an optional solar trickle charger module.

## Related Concepts

- **MeshSync:** The protocol allowing devices to form a self-healing mesh network with up to 4 hops.
- **[OTA Updates](./ota-updates.md):** Firmware over-the-air update capability, which is currently deferred to version 2.1.
- **Solar Trickle Charger:** An optional hardware module proposed for power augmentation.

## Contradictions

&gt; **Contradiction:** Kickoff notes previously mentioned an hourly default reading interval, whereas the current spec draft changes the default to 15 minutes for beta feedback. Consequently, the battery section requires revalidation.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |

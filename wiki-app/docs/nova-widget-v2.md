---
id: nova-widget-v2
title: Nova Widget v2
tags:
  - aurora-labs
  - battery-life-target
  - jonah
  - meshsync
  - mira-chen
  - nordic-nrf52840
  - nova-widget-v2
  - reading-interval
last_updated: "2026-09-02T06:41:03.165655+00:00"
sidebar_label: Nova Widget v2
slug: /nova-widget-v2
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Nova Widget v2

## Overview

[Nova Widget](./nova-widget.md) v2 is the second-generation soil and environment sensor developed by [Aurora Labs](./aurora-labs.md). This [product specification](./product-specification.md) supersedes informal v1 notes where conflicts arise, outlining the [hardware architecture](./hardware-architecture.md), [firmware](./firmware.md) capabilities, [battery life](./battery-life.md) targets, and ongoing open issues for the device.

## Key Details

### Hardware
- **MCU:** Nordic nRF52840
- **[Sensors](./sensors.md):** Capacitive soil moisture, SHT41 temperature/humidity, and VEML7700 light sensors
- **Battery:** CR2032 primary cell
- **Antenna:** PCB trace, 2.4 GHz
- **Enclosure:** IP54 rated for beta units, with an IP65 rating planned for GA if the gasket tooling budget (~$8k) permits

### Firmware & Connectivity
- **Reading Interval:** Defaults to every 15 minutes when the mesh is active. It is configurable from 5 minutes to 24 hours via the companion app.
- **[MeshSync](./meshsync.md):** Devices form a self-healing mesh with a maximum hop count of 4. A USB-powered gateway node bridges the mesh to [MQTT](./mqtt.md).
- **Current Target:** Target average current is &lt; 85 µA, which includes mesh overhead in a 10-node deployment.

### Battery Life Targets
- **Marketing Target:** 24 months at 15-minute intervals in a moderate mesh (≤ 5 nodes).
- **Internal Engineering Target:** 18 months minimum at 10 nodes (retained for internal use; do not publish externally).

### Open Issues
- **Solar Trickle Charger:** Jonah wants an optional module, but [Mira](./aurora-nova-widget-v2.md) has raised concerns regarding the Bill of Materials (BOM).
- **[OTA Updates](./ota-updates.md):** Deferred to version 2.1.

## Related Entities

- **Aurora Labs:** The organization developing Nova Widget v2.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Author of the product specification draft.
- **Jonah:** Team member advocating for the optional solar trickle charger module.
- **Nordic nRF52840:** The microcontroller unit utilized in the [hardware design](./hardware-design.md).

## Related Concepts

- **MeshSync:** The self-healing [mesh networking](./mesh-networking.md) protocol supporting up to 4 hops and MQTT bridging via a gateway node.
- **Environmental Sensing:** Combined soil moisture, temperature, humidity, and light data collection.
- **Over-The-Air (OTA) Updates:** Firmware update mechanism currently deferred to the v2.1 release.

## Contradictions

&gt; **Contradiction:** Kickoff notes previously mentioned an hourly default reading interval, whereas the formal product spec changes the default to every 15 minutes for beta feedback. Consequently, the battery section must be revalidated.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |

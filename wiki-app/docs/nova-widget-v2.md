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
last_updated: "2026-09-01T21:24:21.460777+00:00"
sidebar_label: Nova Widget v2
slug: /nova-widget-v2
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Nova Widget v2

## Overview

[Nova Widget](./nova-widget.md) v2 is the second-generation soil and environment sensor developed by [Aurora Labs](./aurora-labs.md). This product spec draft supersedes any informal v1 notes where conflicts arise. It features a revised [hardware](./hardware.md) platform, updated [firmware](./firmware.md) with [MeshSync](./meshsync.md) capabilities, and targeted improvements for [beta testing](./beta-testing.md) and eventual general availability (GA).

## Key Details

### Hardware Specifications
- **MCU:** Nordic nRF52840
- **[Sensors](./sensors.md):** Capacitive soil moisture, SHT41 temperature/humidity, and VEML7700 light sensors
- **Battery:** CR2032 primary cell
- **Antenna:** PCB trace, 2.4 GHz

### Firmware & Connectivity
- **Reading Interval:** Defaulting to every 15 minutes when the mesh is active. It is configurable from 5 minutes to 24 hours via the companion app.
- **MeshSync:** Devices form a self-healing mesh with a maximum hop count of 4. A USB-powered gateway node bridges the mesh to [MQTT](./mqtt.md).
- **Target Average Current:** Less than 85 µA, including mesh overhead at a 10-node deployment.

### Battery Life Targets
- **Marketing Target:** 24 months at 15-minute intervals in a moderate mesh (≤ 5 nodes).
- **Internal Engineering Target:** 18 months minimum at 10 nodes (retained for internal use; not to be published externally).

### Enclosure & Open Issues
- **Enclosure:** IP54 rating for beta units, with an IP65 rating planned for GA if the gasket tooling budget (~$8k) permits.
- **Solar Trickle Charger:** Jonah is advocating for an optional module, while Mira has expressed concern regarding the Bill of Materials (BOM).
- **[OTA Updates](./ota-updates.md):** Officially deferred to version 2.1.

## Related Entities

- **Aurora Labs:** The manufacturing and development organization behind Nova Widget v2.
- **Mira Chen:** Author of the [Product Specification](./product-specification.md) draft.
- **Jonah:** Team member advocating for the optional solar trickle charger module.
- **Nordic nRF52840:** The microcontroller unit (MCU) utilized in the device hardware.

## Related Concepts

- **MeshSync:** The self-healing [mesh networking](./mesh-networking.md) protocol allowing up to 4 hops and MQTT bridging via a gateway node.
- **Environmental Monitoring:** The application domain covered by capacitive soil moisture, SHT41, and VEML7700 sensors.

## Contradictions

&gt; **Contradiction:** Kickoff notes previously mentioned an hourly default reading interval, whereas the official product spec changes the default interval to 15 minutes for beta feedback, requiring revalidation of the [Battery Life](./battery-life.md) section.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |

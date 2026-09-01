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
last_updated: "2026-09-01T19:20:15.536892+00:00"
sidebar_label: Nova Widget v2
slug: /nova-widget-v2
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Nova Widget v2

## Overview

[Nova Widget](./nova-widget.md) v2 is the second-generation soil and environment sensor developed by [Aurora Labs](./aurora-labs.md). This [product specification](./product-specification.md) draft supersedes any informal v1 notes where conflicts arise. It features upgraded [hardware](./hardware.md), a self-healing [mesh networking](./mesh-networking.md) architecture, and specific targets for battery longevity and environmental sealing.

## Key Details

### Hardware
- **MCU:** Nordic nRF52840
- **[Sensors](./sensors.md):** Capacitive soil moisture, SHT41 temperature/humidity, and VEML7700 light sensors
- **Battery:** CR2032 primary cell
- **Antenna:** PCB trace operating at 2.4 GHz

### Firmware & Networking
- **Reading Interval:** The default interval is **every 15 minutes** when the mesh is active, and is configurable between 5 minutes and 24 hours via the companion app.
- **MeshSync:** Devices organize into a self-healing mesh with a maximum hop count of 4. A USB-powered gateway node bridges the mesh network to [MQTT](./mqtt.md).
- **Power Target:** The target average current is **&lt; 85 µA**, which includes mesh overhead in a 10-node deployment.

### Battery Life Claims
- **Marketing Target:** **24 months** of operation at 15-minute intervals in a moderate mesh network (≤ 5 nodes).
- **Internal Engineering Target:** **18 months minimum** at 10 nodes (retained for internal use; do not publish externally).

### Enclosure & Open Issues
- **Enclosure:** Rated IP54 for beta units, with an IP65 rating planned for General Availability (GA) if the gasket tooling budget (approximately $8k) permits.
- **Solar Trickle Charger:** Jonah desires an optional solar trickle module, though [Mira](./aurora-labs.md) has raised concerns regarding the Bill of Materials (BOM) impact.
- **[OTA Updates](./ota-updates.md):** [Firmware](./firmware.md) Over-The-Air updates are deferred to version 2.1.

## Related Entities

- **Aurora Labs:** The creator and manufacturer of the Nova Widget v2.
- **[Mira Chen](./aurora-labs.md):** Author of the product specification draft; oversees design and raised BOM cost concerns regarding the solar trickle charger.
- **Jonah:** Team member advocating for the optional solar trickle charger module.

## Related Concepts

- **MeshSync:** The self-healing mesh networking protocol utilized by the devices with a max hop count of 4 and an MQTT gateway bridge.
- **Nordic nRF52840:** The microcontroller unit (MCU) driving the widget's hardware capabilities.
- **CR2032 Primary Cell:** The coin cell battery powering the device, tied to strict longevity and current consumption targets.

## Contradictions

&gt; **Contradiction:** The initial kickoff notes mentioned an hourly default reading interval, whereas the current product specification changes the default to every 15 minutes for beta feedback. Consequently, the [battery life](./battery-life.md) section requires revalidation.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |

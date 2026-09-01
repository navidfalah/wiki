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
last_updated: "2026-09-01T19:18:54.188206+00:00"
sidebar_label: Hardware Design
slug: /hardware-design
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Design

## Overview

The [hardware](./hardware.md) design for the [Nova Widget v2](./nova-widget-v2.md)—a second-generation soil and environment sensor developed by [Aurora Labs](./aurora-labs.md)—encompasses its core microcontroller, integrated environmental [sensors](./sensors.md), power systems, [mesh networking](./mesh-networking.md) architecture, and physical enclosure specifications. This design supersedes informal v1 notes where conflicts arise and serves as the [product specification](./product-specification.md) for beta development.

## Key Details

### Core Hardware Components
* **Microcontroller Unit (MCU):** Nordic nRF52840.
* **Sensors:** Capacitive soil moisture sensor, SHT41 temperature and humidity sensor, and VEML7700 light sensor.
* **Power Supply:** CR2032 primary coin cell battery.
* **Antenna:** 2.4 GHz PCB trace antenna.

### Firmware & Networking
* **Reading Interval:** Defaulted to every 15 minutes when the mesh is active. It is configurable between 5 minutes and 24 hours via the companion app.
* **MeshSync:** Devices organize into a self-healing mesh supporting a maximum hop count of 4. A USB-powered gateway node bridges the mesh data to [MQTT](./mqtt.md).
* **Current Consumption Target:** Target average current is &lt; 85 µA, which includes mesh overhead in a 10-node deployment.

### [Battery Life](./battery-life.md) Targets
* **Marketing Target:** 24 months at 15-minute intervals in a moderate mesh network (≤ 5 nodes).
* **Internal Engineering Target:** 18 months minimum at 10 nodes (revalidated following the reading interval change to 15 minutes).

### Enclosure Specifications
* **Rating:** IP54 rating designated for beta units, with an upgrade to IP65 planned for General Availability (GA) if the gasket tooling budget (~$8k) allows.

### Open Design Issues
* **Solar Trickle Charger:** Jonah advocates for an optional solar module, while [Mira](./aurora-labs.md) raises concerns regarding the Bill of Materials (BOM) cost.
* **[OTA Updates](./ota-updates.md):** Over-the-air update capabilities are deferred to version 2.1.

## Related Entities

* **Aurora Labs:** The organization developing the Nova Widget v2.
* **[Mira Chen](./aurora-labs.md):** Author of the product spec draft and stakeholder concerned with BOM costs regarding the solar trickle charger.
* **Jonah:** Team member advocating for an optional solar trickle charger module.
* **Nova Widget v2:** The second-generation soil/environment sensor product being designed.

## Related Concepts

* **Nordic nRF52840:** The primary MCU powering the sensor and its 2.4 GHz communication.
* **MeshSync:** The self-healing mesh networking protocol utilized by the devices to bridge data via a gateway node.
* **IP54 / IP65:** Ingress Protection ratings established for the physical casing of beta and GA units respectively.

## Contradictions

&gt; **Contradiction:** Kickoff notes previously mentioned an hourly default reading interval, whereas the current product spec draft updates the default to 15 minutes for beta feedback, necessitating the revalidation of [battery life](./battery-life.md) calculations.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |

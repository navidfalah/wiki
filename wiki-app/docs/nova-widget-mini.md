---
id: nova-widget-mini
title: Nova Widget Mini
tags:
  - cr2032
  - meshsync
  - nova-widget-mini
  - nrf52840
  - ota
  - wiki
last_updated: "2026-09-02T06:41:01.013555+00:00"
sidebar_label: Nova Widget Mini
slug: /nova-widget-mini
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Nova Widget Mini

## Overview
The [Nova Widget](./nova-widget.md) Mini is a cost-effective variant of the Nova Widget designed specifically for hobbyists. It balances affordability with core functional capabilities, making it an accessible entry point for [IoT](./iot.md) and sensor projects.

## Key Details
- **[Hardware](./hardware.md) Components:** 
  - Powered by a CR2032 coin cell battery.
  - Features a capacitive soil probe for moisture sensing.
  - Built around the nRF52840 microcontroller.
- **[Firmware](./firmware.md) Configuration:** 
  - Runs [MeshSync](./meshsync.md) by default, configured with a 15-minute reporting interval.
  - Over-The-Air (OTA) updates are currently deferred.

## Related Entities
- **Nova Widget:** The standard baseline product from which this mini variant is derived.
- **MeshSync:** The default [networking](./networking.md) and synchronization protocol utilized by the device firmware.

## Related Concepts
- **Capacitive Soil Sensing:** A method of measuring soil moisture levels without exposing metal probes to direct galvanic corrosion, extending sensor longevity.
- **Over-The-Air (OTA) Updates:** Firmware update mechanism that is planned or supported by the underlying architecture, though deferred in the current default configuration.
- **Low-Power IoT Hardware:** The use of energy-efficient microcontrollers like the nRF52840 paired with small coin cell batteries (CR2032) for long-deployment remote [sensors](./sensors.md).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/TEST-product-brief.md` | text | Medium |

---
id: firmware-architecture
title: Firmware Architecture
tags:
  - aurora
  - aurora-labs
  - battery-life-target
  - ble-proxy-update
  - firmware-architecture
  - jonah
  - meshsync
  - meshsync-routing-table-invalidation
last_updated: "2026-09-02T06:39:22.312746+00:00"
sidebar_label: Firmware Architecture
slug: /firmware-architecture
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Architecture

## Overview
The [firmware](./firmware.md) architecture for the [Nova Widget v2](./nova-widget-v2.md) (developed by [Aurora Labs](./aurora-labs.md)) runs on a Nordic nRF52840 MCU and governs sensor reading intervals, [power consumption](./power-consumption.md) targets, self-healing [mesh networking](./mesh-networking.md) via [MeshSync](./meshsync.md), and over-the-air (OTA) update mechanics.

## Key Details
- **MCU & Connectivity:** Built on the Nordic nRF52840 using a 2.4 GHz PCB trace antenna to support a self-healing mesh with a maximum hop count of 4. A USB-powered gateway node bridges the mesh network to [MQTT](./mqtt.md).
- **Reading Interval:** The default sensor reading interval is **every 15 minutes** when the mesh is active (configurable from 5 minutes to 24 hours via the companion app).
- **Power & Battery Targets:** 
  - Target average current is **&lt; 85 µA** including mesh overhead in a 10-node deployment.
  - Marketing targets a **24-month** [battery life](./battery-life.md) at 15-minute intervals in a moderate mesh ($\le$ 5 nodes).
  - Internal engineering targets **18 months minimum** at 10 nodes (do not publish externally).
- **[OTA Updates](./ota-updates.md) (Deferred to v2.1):** 
  - Requirements include signed firmware images using ed25519, rollback protection after mesh-wide upgrades, and a [BLE](./ble.md) proxy update feature via a phone app when a mesh node is unreachable.
  - Identified risks include potential brick scenarios if a parent node dies mid-push, and MeshSync routing table invalidation during flashing.
  - Sam Rivera ([TeaBuddy](./teabuddy.md)) offered to share a test harness for simpler single-device BLE DFU, but Aurora deferred.

## Related Entities
- **Aurora Labs:** Creator and manufacturer of the Nova Widget v2.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Author of the [product specifications](./product-specifications.md) and OTA update design sketches.
- **Jonah:** Team member interested in an optional solar trickle charger module.
- **Sam Rivera:** Contact at TeaBuddy who offered a single-device BLE DFU test harness.
- **Nordic nRF52840:** The microcontroller utilized for the widget.

## Related Concepts
- **MeshSync:** The self-healing mesh protocol used for device communication and data routing.
- **BLE Proxy Update:** A method allowing users to update unreachable mesh nodes locally via a phone application over [Bluetooth Low Energy](./bluetooth-low-energy.md).
- **Ed25519:** The digital signature scheme intended for verifying signed firmware images.

## Contradictions
&gt; **Contradiction:** Early kickoff notes mentioned an hourly default reading interval, whereas the beta [product specification](./product-specification.md) explicitly changes the default reading interval to 15 minutes.
&gt; 
&gt; **Contradiction:** Open issues in the product spec state that OTA updates are "deferred to v2.1," yet separate design sketches dated July 2026 explicitly detail OTA update requirements, risks, and design considerations (not shipping in beta).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |
| 2 | `samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md` | text | Unverified |

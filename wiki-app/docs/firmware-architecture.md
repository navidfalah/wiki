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
last_updated: "2026-09-01T19:18:34.533684+00:00"
sidebar_label: Firmware Architecture
slug: /firmware-architecture
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Architecture

## Overview

The [firmware](./firmware.md) architecture for the [Nova Widget v2](./nova-widget-v2.md) (developed by [Aurora Labs](./aurora-labs.md)) is designed to support low-power operation, self-healing [mesh networking](./mesh-networking.md), and reliable firmware management on the Nordic nRF52840 MCU. 

## Key Details

- **MCU & Connectivity:** Built on the Nordic nRF52840 microcontroller utilizing a 2.4 GHz PCB trace antenna.
- **Reading Intervals:** The default sensor reading interval is every 15 minutes when the mesh is active, and is configurable between 5 minutes and 24 hours via the companion app. 
- **MeshSync:** Devices form a self-healing mesh network with a maximum hop count of 4. A USB-powered gateway node bridges the mesh network to [MQTT](./mqtt.md).
- **[Power Consumption](./power-consumption.md) Targets:** 
  - Target average current: &lt; 85 µA including mesh overhead in a 10-node deployment.
  - Marketing [battery life](./battery-life.md) target: 24 months at 15-minute intervals in a moderate mesh (≤ 5 nodes).
  - Internal engineering battery life target: 18 months minimum at 10 nodes.
- **[OTA Updates](./ota-updates.md) (Design Sketch v2.1):** 
  - Features signed firmware images using ed25519.
  - Implements rollback protection after mesh-wide upgrades.
  - Supports [BLE](./ble.md) proxy updates via phone app when a mesh node is unreachable.
  - OTA updates are explicitly deferred to version 2.1 and will not ship in the initial beta release.

## Related Entities

- **Aurora Labs:** The organization developing the Nova Widget v2.
- **[Mira Chen](./aurora-labs.md):** Author of the [product specifications](./product-specifications.md) and OTA update design sketches.
- **Jonah:** Team member who requested an optional solar trickle charger module.
- **Sam Rivera:** [TeaBuddy](./teabuddy.md) contact who offered to share a test harness for single-device BLE DFU.

## Related Concepts

- **MeshSync:** The self-healing mesh routing protocol used by the widgets, which faces risks such as routing table invalidation during flashing.
- **BLE Proxy Update:** A mechanism allowing [firmware updates](./firmware-updates.md) via a phone app when direct mesh connection is unavailable.
- **Ed25519:** Cryptographic signature scheme designated for signing firmware images.

## Contradictions

&gt; **Contradiction:** Early kickoff notes mentioned an hourly default reading interval, whereas the formal product spec draft updated the default to every 15 minutes for beta feedback.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |
| 2 | `samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md` | text | Unverified |

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
last_updated: "2026-09-01T21:22:43.332224+00:00"
sidebar_label: Firmware Architecture
slug: /firmware-architecture
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Architecture

## Overview
The [firmware](./firmware.md) architecture for the [Aurora Labs Nova](./nova-widget.md) Widget v2 is designed to support low-power operations, self-healing [mesh networking](./mesh-networking.md), and robust device management on a Nordic nRF52840 MCU. While initial [beta testing](./beta-testing.md) releases prioritize core sensor reading intervals and mesh telemetry, upcoming iterations incorporate over-the-air ([OTA updates](./ota-updates.md)) update capabilities, security features, and alternative update vectors like [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) proxy updates.

## Key Details

### Reading Interval & Sensor Operations
- **Default Reading Interval:** Set to every 15 minutes when the mesh is active. It is configurable between 5 minutes and 24 hours via the companion app.
- **[Power Management](./power-management.md) & Targets:** 
  - Target average current is **&lt; 85 µA**, inclusive of mesh overhead in a 10-node deployment.
  - Marketing [battery life](./battery-life.md) target is **24 months** at 15-minute intervals in a moderate mesh ($\le$ 5 nodes).
  - Internal engineering battery life target is **18 months minimum** at 10 nodes (revalidated from earlier hourly default kickoffs).

### MeshSync and Networking
- Devices form a self-healing mesh network with a maximum hop count of 4.
- A USB-powered gateway node bridges mesh data to [MQTT](./mqtt.md).
- [MeshSync](./meshsync.md) handles network coordination, though flashing updates introduces risks such as routing table invalidation.

### OTA Updates & Firmware Deployment
- **Status:** Deferred to version 2.1 (not shipping in the initial beta).
- **Requirements (Design Sketch):**
  - Signed firmware images using ed25519.
  - Rollback protection implemented after a mesh-wide upgrade.
  - BLE proxy updates via a phone app when a mesh node is unreachable.
- **Risks & Open Questions:**
  - Risk of bricking if a parent node dies mid-push.
  - Potential MeshSync routing table invalidation during the flashing process.
  - Open question on whether [OTA updates](./ota-updates.md) should require explicit user consent per node or support batch "update all" commands.
  - Sam Rivera ([TeaBuddy](./teabuddy.md)) offered to share a test harness for simpler single-device BLE DFU, which Aurora initially deferred.

## Related Entities
- **Aurora Labs:** The organization developing the [Nova Widget v2](./nova-widget-v2.md) and its firmware architecture.
- **Nordic nRF52840:** The microcontroller unit (MCU) powering the Nova Widget v2.
- **[Mira Chen](./nova-widget.md):** Author of the product spec draft and OTA update design sketch.
- **Jonah:** Team member interested in an optional solar trickle charger module.
- **Sam Rivera:** TeaBuddy contact who offered a single-device BLE DFU test harness.

## Related Concepts
- **MeshSync:** The protocol/mechanism governing self-healing mesh topology, routing tables, and data overhead.
- **BLE DFU / Proxy Update:** A secondary update mechanism utilizing Bluetooth Low Energy via phone apps for unreachable nodes.
- **Ed25519:** Cryptographic signature standard planned for verifying signed firmware images.

## Contradictions
&gt; **Contradiction:** Kickoff notes originally mentioned an hourly default reading interval, whereas the [product specification](./product-specification.md) draft updated the default reading interval to 15 minutes for beta feedback, requiring revalidation of the battery section.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |
| 2 | `samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md` | text | Unverified |

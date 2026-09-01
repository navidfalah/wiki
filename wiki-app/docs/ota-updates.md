---
id: ota-updates
title: OTA Updates
tags:
  - aurora
  - ble-proxy-update
  - meshsync-routing-table-invalidation
  - mira-chen
  - nova-widget
  - ota-updates
  - rollback-protection
  - sam-rivera
last_updated: "2026-09-01T21:24:27.364883+00:00"
sidebar_label: OTA Updates
slug: /ota-updates
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# OTA Updates

## Overview
Over-The-Air (OTA) updates for the [Nova Widget](./nova-widget.md) project were designed in July 2026 by Mira Chen. As outlined in the initial design sketch, the feature is not slated to ship in the beta release and remains in an exploratory/planning phase.

## Key Details
- **[Firmware](./firmware.md) Security:** Requires signed firmware images utilizing ed25519.
- **Rollback Protection:** Implements rollback protection following a mesh-wide upgrade.
- **[BLE](./ble.md) Proxy Updates:** Supports updating via a phone app using a [BLE](./ble.md) proxy when a mesh node is unreachable.
- **User Experience Open Question:** The team is deliberating whether OTA updates should require explicit user consent per individual node or support a batch "update all" mechanism.

## Related Entities
- **Mira Chen:** Author of the Nova Widget OTA update design sketch.
- **Nova Widget:** The target device for the proposed OTA architecture.
- **Sam Rivera:** Uses simpler single-device [BLE](./ble.md) DFU and offered to share a test harness.
- **Aurora:** Team or entity that deferred on using Sam Rivera's offered test harness.

## Related Concepts
- **Signed Firmware:** Using cryptographic signatures (ed25519) to verify update integrity.
- **Rollback Protection:** Preventing reverted firmware versions after a network-wide upgrade.
- **BLE DFU / Proxy Update:** Over-the-air device [firmware updates](./firmware-updates.md) routed through [Bluetooth Low Energy](./bluetooth-low-energy.md).
- **[MeshSync](./meshsync.md) Routing Table Invalidation:** A network risk associated with flashing nodes.

## Contradictions
*(No contradictions present in the provided source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md` | text | Unverified |

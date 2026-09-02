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
last_updated: "2026-09-02T06:41:08.637146+00:00"
sidebar_label: OTA Updates
slug: /ota-updates
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# OTA Updates

## Overview
The Over-The-Air (OTA) update design for the [Nova Widget](./nova-widget.md), authored by Mira Chen on July 4, 2026, outlines the foundational requirements, associated risks, and open architectural questions for handling [firmware updates](./firmware-updates.md) across the device network. This feature is currently marked as **NOT SHIPPING IN BETA**.

## Key Details
- **Firmware Security:** Requires signed firmware images utilizing the `ed25519` signature scheme.
- **Rollback Protection:** Enforces rollback protection following a mesh-wide upgrade.
- **[BLE](./ble.md) Proxy Updates:** Supports updating via phone app using a [Bluetooth Low Energy](./bluetooth-low-energy.md) (BLE) proxy when a mesh node is otherwise unreachable.
- **Collaboration & Testing:** Sam Rivera utilizes a simpler single-device BLE DFU (Device Firmware Update) and offered to share a test harness, though Aurora has deferred this offer.
- **Open Questions:** The team is currently debating whether OTA rollouts should require explicit user consent per individual node or utilize a batch "update all" approach.

## Related Entities
- **Mira Chen:** Author of the Nova Widget OTA update design sketch.
- **Nova Widget:** The [hardware](./hardware.md)/software product targeted by the OTA update design.
- **Sam Rivera:** Developer using simpler single-device BLE DFU who offered a test harness.
- **Aurora:** Entity/team that deferred Sam Rivera's test harness offer.

## Related Concepts
- **Signed Firmware Images:** Use of cryptographic signatures (`ed25519`) to verify the authenticity and integrity of updates before installation.
- **Rollback Protection:** A security mechanism preventing devices from reverting to older, potentially vulnerable firmware versions.
- **BLE Proxy Update:** A fallback mechanism enabling firmware delivery to isolated nodes via a smartphone's BLE connection.
- **[MeshSync](./meshsync.md) Routing Table Invalidation:** The risk of disrupting network routing states during the flashing process.

## Contradictions
*(No contradictions present in the current source material)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md` | text | Unverified |

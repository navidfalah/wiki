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
last_updated: "2026-09-01T19:20:21.660674+00:00"
sidebar_label: OTA Updates
slug: /ota-updates
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# OTA Updates

## Overview

The Over-The-Air (OTA) update design for the [Nova Widget](./nova-widget.md), authored by [Mira Chen](./aurora-labs.md) on July 4, 2026, outlines the foundational requirements, risks, and open questions for remote device [firmware](./firmware.md) management. As of its initial drafting, this design is **not shipping in beta**.

## Key Details

- **Requirements:** 
  - Signed firmware images utilizing ed25519 cryptography.
  - Rollback protection enforced after a mesh-wide upgrade is completed.
  - [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) proxy updates executed via a phone application when a mesh node is otherwise unreachable.
- **Risks:** 
  - Potential brick scenario if a parent node fails mid-push during the update process.
  - MeshSync routing table invalidation occurring while the flash operation is underway.
- **Open Question:** 
  - Whether OTA deployments should require explicit user consent on a per-node basis or support a batch "update all" mechanism.

## Related Entities

- **Mira Chen:** Author of the Nova Widget OTA update design sketch.
- **Nova Widget:** The [hardware](./hardware.md)/software product for which the OTA update design was sketched.
- **Sam Rivera:** Uses simpler single-device BLE DFU and offered to share a test harness.
- **Aurora:** Team or entity that deferred the offer regarding the test harness.

## Related Concepts

- **Firmware Signing:** The use of ed25519 signatures to verify the authenticity and integrity of firmware images before installation.
- **Rollback Protection:** A security measure preventing downgraded firmware versions from being installed after a successful mesh-wide upgrade.
- **BLE Proxy Updates:** A fallback update method leveraging a mobile phone application to push updates via Bluetooth when standard mesh routing is unreachable.
- **MeshSync Routing Table Invalidation:** A network routing disruption risk triggered during the node flashing process.

## Contradictions

*(No contradictions identified in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md` | text | Unverified |

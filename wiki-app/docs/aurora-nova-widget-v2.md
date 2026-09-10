---
id: aurora-nova-widget-v2
title: Aurora Nova Widget v2
tags:
  - aurora-nova-widget-v2
  - aurora-nova-widget-v2-beta
  - homelab
  - jonah
  - meshsync
  - mira
  - mqtt-rejoin-storms
  - mqtt-schema-v2
last_updated: "2026-09-10T14:37:00.707649+00:00"
sidebar_label: Aurora Nova Widget v2
slug: /aurora-nova-widget-v2
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Aurora Nova Widget v2

## Overview
The [Aurora Nova Widget](./aurora-nova-widget.md) v2 (currently in beta) is a smart home device tailored for [homelab](./homelab.md) enthusiasts seeking a local setup without cloud subscriptions. It utilizes [MeshSync](./meshsync.md) technology for device communication. While powerful, users have encountered scaling challenges and [MQTT](./mqtt.md) rejoin storms when deploying multiple nodes in a mesh network topology.

## Key Details
- **[Firmware](./firmware.md) Versions & [Bug Fixes](./bug-fixes.md):**
  - Version 0.3.7 exhibits duplicate messages during MQTT rejoin storms.
  - Version 0.3.8 (and newer) introduces fixes for the MeshSync rejoin loop and rejoin storms, and requires MQTT Schema v2.
- **Network Scaling & Limitations:**
  - Adding 8 or more nodes can cause the entire mesh to stop reporting for hours, requiring a power cycle.
  - Support recommends limiting setups to 6 nodes until patches are fully deployed.
- **Power & Battery:**
  -
- **[MQTT Integration](./mqtt-integration.md):**
  - [MQTT export](./mqtt-export.md) is supported, but users should filter the neighbors topic and utilize MQTT Schema v2 on firmware 0.3.8+.

## Related Entities
- **[Aurora Labs](./aurora-labs.md):** Manufacturer/developer of the widget.
- **Mira:** Support agent handling technical tickets.
- **Jonah:** Internal team member tracking [documentation](./documentation.md) and product comparisons.
- **[SenseNode](./sensenode.md):** A competing or alternative device noted for simpler topology and cloud subscription requirements.
- **[TeaBuddy](./teabuddy.md):** A kitchen-focused companion device that lacks MQTT support and operates via a [BLE](./ble.md) app only.

## Related Concepts
- **MeshSync:** The local mesh protocol used by the widget to avoid cloud subscriptions, introducing complexity at scale.
- **MQTT Rejoin Storms:** Network traffic congestion and duplicate message generation occurring when multiple nodes simultaneously attempt to rejoin the mesh.
- **MQTT Schema v2:** The required data schema for firmware 0.3.8 and above.
- **Homelab Integration:** Community-driven setups connecting local [hardware](./hardware.md) to platforms like [Home Assistant](./home-assistant.md).

## Contradictions

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt` | text | Unverified |
| 2 | `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt` | text | Unverified |

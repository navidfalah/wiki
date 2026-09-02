---
id: mqtt
title: MQTT
tags:
  - aurora-mqtt-schema-v2
  - aurora-nova-widget-v2-beta
  - meshsync
  - mosquitto
  - mqtt
  - mqtt-export
  - rejoin-storms
  - teabuddy
last_updated: "2026-09-02T06:40:56.128838+00:00"
sidebar_label: MQTT
slug: /mqtt
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MQTT

## Overview
MQTT is utilized for local device integration—such as with [Home Assistant](./home-assistant.md)—using a local broker like Mosquitto alongside tools like [MeshSync](./meshsync.md) and the [Aurora Nova Widget v2 beta](./aurora-nova-widget-v2.md).

## Key Details
- **Prerequisites:** Requires MeshSync 0.3.8+, a local MQTT broker (Mosquitto), and the Aurora MQTT schema v2.
- **Quick Start:** 
  1. Enable [MQTT Export](./mqtt-export.md) in device settings (use UART command `mqtt on` until app support is available).
  2. Subscribe to `aurora/+/telemetry`.
  3. Map soil moisture to `%` entity.
- **Configuration & Quirks:**
  - Default telemetry interval is 15 minutes; do not use hourly automation templates from old blog posts.
  - Rejoin events can flood logs or cause duplicate messages during rejoin storms. This is known on version 0.3.7 (resolved in 0.3.8 by upgrading, filtering the `mesh/neighbors` topic, and limiting to 6 nodes).

## Related Entities
- **Aurora Nova Widget v2 beta:** The product associated with support ticket #2210 regarding MQTT setup.
- **Mosquitto:** The local MQTT broker recommended for the integration.
- **MeshSync:** Required version 0.3.8+ for stable integration.
- **[TeaBuddy](./teabuddy.md):** A kitchen device that does not feature MQTT integration (operates via [BLE](./ble.md) app only).

## Related Concepts
- **Aurora MQTT schema v2:** The required schema version for 0.3.8+.
- **Rejoin-storms:** Network reconnection events that can cause message duplication and log flooding on older versions.

## Contradictions
&gt; **Contradiction:** Regarding the TeaBuddy appliance, the community guide includes a joke post suggesting a microphone listens for a buzz via a community MQTT hack, whereas official support clarifies that TeaBuddy has no MQTT support and is BLE app only.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |
| 2 | `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt` | text | Unverified |

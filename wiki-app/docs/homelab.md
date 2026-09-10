---
id: homelab
title: Homelab
tags:
  - aurora-labs
  - aurora-mqtt-schema-v2
  - homelab
  - meshsync
  - mosquitto
  - nova-widget
  - rejoin-events-log-flooding
  - teabuddy
last_updated: "2026-09-10T14:38:47.023031+00:00"
sidebar_label: Homelab
slug: /homelab
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Homelab

## Overview
This wiki page covers community-driven integrations and configurations for the [homelab](./homelab.md) environment, specifically focusing on connecting devices like the [Nova Widget](./nova-widget.md) to [Home Assistant](./home-assistant.md) using [MeshSync](./meshsync.md) and local [MQTT](./mqtt.md) infrastructure.

## Key Details
- **Prerequisites:** 
  - MeshSync version 0.3.8 or higher
  - Local MQTT broker (Mosquitto)
  - [Aurora](./aurora-nova-widget-v2.md) MQTT schema v2
- **Quick Start Steps:**
  1. Enable [MQTT Export](./mqtt-export.md) in the device settings (use UART command `mqtt on` until official app support is available).
  2. Subscribe to the `aurora/+/telemetry` topic.
  3. Map soil moisture to a percentage (`%`) entity.
- **Known Quirks & Best Practices:**
  - Rejoin events can flood logs when running 8 nodes; filter the `mesh/neighbors` topic to mitigate this.
  - The default polling interval is 15 minutes. Avoid using hourly automation templates found in older blog posts.

## Related Entities
- **Nova Widget:** The [Hardware](./hardware.md) device integrated via the community guide.
- **MeshSync:** Required service (version 0.3.8+) for synchronization.
- **Mosquitto:** The local MQTT broker utilized for message handling.

## Related Concepts
- **Aurora MQTT schema v2:** The messaging schema required for telemetry and integration data formatting.
- **Telemetry:** Data collection methodology used to track metrics such as soil moisture.

## Contradictions
&gt; **Contradiction:** Regarding the [TeaBuddy](./teabuddy.md) integration, the community hack involving a microphone listening for a buzz is explicitly noted as a joke post and should not be ingested as a specification.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |

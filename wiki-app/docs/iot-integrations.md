---
id: iot-integrations
title: IoT Integrations
tags:
  - aurora-mqtt-schema-v2
  - iot-integrations
  - meshsync
  - mosquitto
  - teabuddy
  - telemetry-export
  - wiki
last_updated: "2026-09-01T19:19:29.198362+00:00"
sidebar_label: IoT Integrations
slug: /iot-integrations
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# IoT Integrations

## Overview
This page documents the community guide for integrating [Nova](./aurora-labs.md) Widgets with [Home Assistant](./home-assistant.md) and local [MQTT](./mqtt.md) infrastructure, based on unofficial community contributions.

## Key Details
- **Prerequisites:**
  - MeshSync version 0.3.8 or higher
  - Local MQTT broker (Mosquitto)
  - [Aurora](./aurora-labs.md) MQTT schema v2
- **Quick Start Steps:**
  1. Enable [MQTT Export](./mqtt-export.md) in device settings using the UART command `mqtt on` (until full app support is available).
  2. Subscribe to the `aurora/+/telemetry` topic.
  3. Map soil moisture values to a percentage (`%`) entity.
- **Known Quirks & [Troubleshooting](./troubleshooting.md):**
  - Rejoin events can flood logs when running 8 nodes; filter the `mesh/neighbors` topic to mitigate this.
  - The default reporting interval is 15 minutes. Avoid using hourly automation templates from older blog posts.

## Related Entities
- [Nova Widget](./nova-widget.md)
- MeshSync
- Mosquitto
- Aurora MQTT schema v2
- Home Assistant

## Related Concepts
- MQTT telemetry export
- Soil moisture mapping
- [Mesh Networking](./mesh-networking.md) and node rejoin events

## Contradictions
&gt; **Contradiction:** The [TeaBuddy](./teabuddy.md) integration is listed as a community hack where a microphone listens for a buzz; however, this is explicitly noted as a joke post and must not be ingested as a technical specification.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |

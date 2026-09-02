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
last_updated: "2026-09-02T06:40:18.678261+00:00"
sidebar_label: IoT Integrations
slug: /iot-integrations
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# IoT Integrations

## Overview
This page outlines the community guide for integrating [Nova](./aurora-nova-widget-v2.md) Widgets with [Home Assistant](./home-assistant.md), detailing prerequisites, quick start steps, known operational quirks, and community workarounds for unsupported devices.

## Key Details
- **Prerequisites:**
  - [MeshSync](./meshsync.md) version 0.3.8 or higher.
  - A local [MQTT](./mqtt.md) broker (Mosquitto).
  - [Aurora](./aurora-nova-widget-v2.md) MQTT schema v2.
- **Quick Start Steps:**
  1. Enable [MQTT Export](./mqtt-export.md) in the device settings (use the UART command `mqtt on` until official app support is added).
  2. Subscribe to the `aurora/+/telemetry` topic.
  3. Map soil moisture to a percentage (`%`) entity.
- **Known Quirks:**
  - Rejoin events can flood logs when running 8 nodes; filter the `mesh/neighbors` topic to mitigate this.
  - The default reporting interval is 15 minutes. Avoid using hourly automation templates from older blog posts.

## Related Entities
- **MeshSync** (v0.3.8+)
- **Mosquitto** (Local MQTT broker)
- **Nova Widgets**

## Related Concepts
- **Aurora MQTT Schema v2**
- **Telemetry Export**
- **MQTT Integration & Automation**

## Contradictions
&gt; **Contradiction:** The [TeaBuddy](./teabuddy.md) integration status contains a community hack involving a microphone listening for a buzz, which is explicitly noted as a joke post and should not be ingested as a system specification.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |

---
id: mqtt-integration
title: MQTT Integration
tags:
  - aurora-labs
  - aurora-mqtt-schema-v2
  - meshsync
  - mosquitto
  - mqtt-integration
  - nova-widget
  - rejoin-events-log-flooding
  - teabuddy
last_updated: "2026-09-10T14:39:22.904468+00:00"
sidebar_label: MQTT Integration
slug: /mqtt-integration
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MQTT Integration

## Overview
This page documents the unofficial community guide for integrating the [Nova Widget](./nova-widget.md) with [Home Assistant](./home-assistant.md) via [MQTT](./mqtt.md), based on community contributions.

## Key Details
- **Prerequisites:** 
  - [MeshSync](./meshsync.md) 0.3.8+
  - Local MQTT broker (Mosquitto)
  - [Aurora](./aurora-nova-widget-v2.md) MQTT schema v2
- **Quick Start Steps:**
  1. Enable [MQTT export](./mqtt-export.md) in device settings by using the UART command `mqtt on` (until full app support is available).
  2. Subscribe to the topic `aurora/+/telemetry`.
  3. Map soil moisture to a `%` entity.
- **Known Quirks:**
  - Rejoin events can flood logs when running 8 nodes; filter the `mesh/neighbors` topic to mitigate this.
  - The default reporting interval is 15 minutes; do not use hourly automation templates from older blog posts.

## Related Entities
- Nova Widget
- MeshSync
- Mosquitto

## Related Concepts
- Aurora MQTT schema v2
- Telemetry export
- UART commands

## Contradictions
&gt; **Contradiction:** The [TeaBuddy](./teabuddy.md) section mentions an unofficial community hack where a microphone listens for a buzz, but explicitly notes that it is a "joke post, do not ingest as spec."

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |

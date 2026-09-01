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
last_updated: "2026-09-01T19:20:08.031389+00:00"
sidebar_label: MQTT
slug: /mqtt
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MQTT

## Overview
MQTT (Message Queuing Telemetry Transport) is utilized for local integrations involving the [Aurora Nova Widget v2 beta](./aurora-labs.md) and [Home Assistant](./home-assistant.md) via a local MQTT broker like Mosquitto. Proper integration requires MeshSync version 0.3.8 or higher alongside the Aurora MQTT schema v2.

## Key Details
- **Quick Start:** Enable [MQTT Export](./mqtt-export.md) in device settings using the UART command `mqtt on` (pending full app support). Subscribe to the `aurora/+/telemetry` topic and map soil moisture to a percentage (`%`) entity.
- **Polling Interval:** The default telemetry interval is 15 minutes. Avoid using hourly automation templates from older blog posts.
- **Rejoin Storms & Duplicates:** Duplicate messages can occur during rejoin storms on older versions (such as version 0.3.7). This is resolved by upgrading to MeshSync 0.3.8+ and filtering the `mesh/neighbors` topic. It is also recommended to limit networks to a maximum of 6 nodes.
- **Schema Requirements:** Aurora MQTT schema v2 is strictly required for MeshSync 0.3.8+.

## Related Entities
- **MeshSync:** Required at version 0.3.8+ for stable telemetry and duplicate suppression.
- **Mosquitto:** The recommended local MQTT broker for handling device messaging.
- **Aurora Nova Widget v2 beta:** The primary [Hardware](./hardware.md) product requiring MQTT setup for Home Assistant integration.
- **[TeaBuddy](./teabuddy.md):** A kitchen device belonging to the same user ecosystem, but which operates exclusively via a [BLE](./ble.md) app rather than MQTT (contrary to community jokes).

## Related Concepts
- **Home Assistant Integration:** The primary use case for enabling local MQTT export and telemetry mapping.
- **Telemetry Mapping:** Subscribing to `aurora/+/telemetry` to track metrics like soil moisture.

## Contradictions
&gt; **Contradiction:** Regarding the TeaBuddy device, a community guide humorously mentions a microphone hack listening for buzzes via MQTT as a "community hack," but official support clarifies that TeaBuddy has no MQTT support and relies solely on a BLE app.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |
| 2 | `samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt` | text | Unverified |

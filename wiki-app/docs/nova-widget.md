---
id: nova-widget
title: Nova Widget
tags:
  - aurora
  - aurora-labs
  - aurora-labs-support
  - aurora-nova-widget-v2
  - battery-specifications
  - ble-proxy-update
  - data-loss-on-factory-reset
  - default-read-interval
last_updated: "2026-09-01T19:20:19.764912+00:00"
sidebar_label: Nova Widget
slug: /nova-widget
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Nova Widget

## Overview

The **[Nova](./aurora-labs.md) Widget** (developed by [Aurora Labs](./aurora-labs.md), founded by [Mira Chen](./aurora-labs.md) and Jonah Park) is an open-source [IoT](./iot.md) sensor designed primarily for home gardeners and small-acreage farmers. Its core mission philosophy is "Open [sensors](./sensors.md) for people who own their data," featuring local operation without mandatory cloud accounts, exporting telemetry via [MQTT](./mqtt.md) or CSV, and maintaining compatibility with [Home Assistant](./home-assistant.md) hobbyist setups.

## Key Details

### Hardware & Sensors
- **MCU:** nRF52840
- **Sensors:** Capacitive soil moisture (30mm length), air temperature, and ambient light (simple photodiode).
- **Enclosure:** 3D printed PETG pebble shape for beta units with a silicone 50A gasket (IP54 splash rated; IP65 tooled variant was deferred).
- **[Battery Specifications](./battery-specifications.md):** Uses a CR2032 coin cell battery ([hardware](./hardware.md) revision C fixes a battery rattle issue). *Note: Previous misprints/docs incorrectly referenced the CR2450.* 
- **[Power Budget](./power-budget.md) & Targets:** 
  - Sleep current: 4.2 µA target
  - Sample + TX: 12 mA peak
  - Rejoin spike: 110–340 µA
  - Engineering estimates 18 months of [battery life](./battery-life.md) at 10 nodes, while marketing claims up to 2 years.

### Firmware & Networking (MeshSync)
- **Mesh Protocol:** Uses a custom mesh protocol codenamed **MeshSync** for range extension. 
- **Default Read Interval:** Configured to 15 minutes per reading cycle (though initial kickoff notes proposed hourly readings).
- **[Firmware](./firmware.md) Milestones:** Firmware 0.3.9 (beta candidate) addresses MeshSync relay [battery drain](./battery-drain.md) ([MESH-118](./mesh-118.md)) and should be flashed before adding more than 6 nodes to a mesh. Previous baseline included MeshSync 0.3.8.
- **[OTA Updates](./ota-updates.md):** Designed with ed25519 signed firmware images, rollback protection, and [BLE](./ble.md) proxy updates via a phone app when mesh nodes are unreachable. (Note: OTA updates are not shipping in the initial beta).

### MQTT Schema
Supports optional local [MQTT export](./mqtt-export.md) matching topics such as:
- `aurora/{device_id}/telemetry`
- `aurora/{device_id}/battery`
- `aurora/{device_id}/mesh/neighbors`

## Related Entities

- **Aurora Labs:** The maker entity founded by Mira Chen (firmware, MeshSync, power profiling) and Jonah Park (PCB, sensors, mechanical).
- **Kevin Ostrander:** Beta tester (batch 4) who reported Wi-Fi reconnection issues following power outages.
- **Sam Rivera:** Associated with the [TeaBuddy](./teabuddy.md) product, offered to share single-device BLE DFU test harnesses.

## Related Concepts

- **MeshSync:** The proprietary mesh routing protocol handling multi-node communication up to a theoretical limit of 32 nodes (beta tested unstably up to 8 nodes).
- **Soft Wi-Fi Reset:** Holding the side button for 3 seconds to reset Wi-Fi state without wiping sensor history (as opposed to a full factory reset).
- **Static DHCP Reservation:** Recommended workaround for preventing IP-change re-pairing bugs on Wi-Fi reconnection.

## Contradictions

&gt; **Contradiction:** Battery lifespan estimates differ across project documents. Initial kickoff notes targeted 2 years on a CR2032 with hourly readings, whereas later spec fragments and test records note an engineering target of 18 months at 10 nodes (with marketing holding to a 2-year claim).

&gt; **Contradiction:** The default reading interval changed during development. Early kickoff [meeting notes](./meeting-notes.md) and slides specified *hourly* reading batches, whereas later specifications and code exports establish a *15-minute* default reading cycle.

&gt; **Contradiction:** Discrepancies exist regarding battery part specifications. While the hardware revision C spec explicitly clarifies that the device uses a CR2032 and warns against printing CR2450 (due to a previous misprint causing ticket #2201), alternate notes mistakenly referenced CR2450.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-10-nova-widget-beta-invite.eml` | email | Medium |
| 2 | `emails/2026-06-11-nova-59-customer-wifi-complaint.eml` | email | Medium |
| 3 | `emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |
| 4 | `notes/2026-05-01-kickoff-notes.md` | text | Medium |
| 5 | `notes/TEST-kickoff-meeting.txt` | text | Medium |
| 6 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |
| 7 | `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md` | text | Unverified |
| 8 | `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md` | text | Unverified |
| 9 | `samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md` | text | Unverified |
| 10 | `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md` | text | Unverified |

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
last_updated: "2026-09-10T14:39:30.858693+00:00"
sidebar_label: Nova Widget
slug: /nova-widget
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Nova Widget

## Overview

The **[Nova](./aurora-nova-widget-v2.md) Widget** (developed by [Aurora Labs](./aurora-labs.md), founded by [Mira Chen](./aurora-nova-widget-v2.md) and Jonah Park) is an open-source [IoT](./iot.md) sensor designed primarily for home gardeners and small-acreage farmers. Its core mission is encapsulated in the draft statement: *"Open [sensors](./sensors.md) for people who own their data."* 

The device features a pebble-shaped 3D-printed PETG enclosure (silicone 50A gasket providing IP54 splash resistance, with an IP65 variant deferred) and includes:
- Capacitive soil moisture sensing (30mm probe length)
- Air temperature monitoring
- Ambient light detection via a simple photodiode
- [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) for phone setup and optional phone app BLE proxy updates
- The custom **[MeshSync](./meshsync.md)** local mesh protocol for range extension (no mandatory cloud subscription; export via CSV or local [MQTT](./mqtt.md) compatible with [Home Assistant](./home-assistant.md))

Non-goals for the device include cameras, GPS, and mandatory cloud dashboards.

---

## Key Details

### Technical Specifications
- **Microcontroller (MCU):** Nordic nRF52840
- **Battery:** CR2032 × 1 ([Hardware](./hardware.md) Rev C features a battery holder fix to prevent rattling). [Marketing](./marketing.md) materials target a 2-year lifespan, while engineering estimates 18 months with 10 nodes. 
- **[Power Budget](./power-budget.md) & Profiles:**
  - Sleep mode: 4.2 µA
  - Sample + TX: 12 mA peak
  - Rejoin spike: 110–340 µA
- **Read Intervals:** Defaulting to 15 minutes per reading cycle (though initial kickoff [documentation](./documentation.md) suggested hourly intervals).
- **Mesh Limits:** Designed theoretically for up to 32 nodes, though [beta testing](./beta-testing.md) has encountered instability around 8 nodes.

### Firmware & Updates
- **[MeshSync Protocol](./meshsync-protocol.md):** Developed by Mira Chen, version 0.3.8 / 0.3.9 beta builds address relay [battery drain](./battery-drain.md) (such as ticket [MESH-118](./mesh-118.md)).
- **[OTA Updates](./ota-updates.md):** Signed [firmware](./firmware.md) images using ed25519 with rollback protection. OTA features are not shipping in the current beta and require handling risks like mesh-wide upgrade routing table invalidations.

---

## Related Entities

- **Aurora Labs:** The parent company and maker of the Nova Widget.
- **Mira Chen:** Co-founder responsible for firmware, the MeshSync protocol, and power profiling.
- **Jonah Park:** Co-founder responsible for PCBs, sensors, and [mechanical design](./mechanical-design.md).
- **[SenseNode](./sensenode.md) (Competitor):** Features a waterproof IP67 variant (referenced in comparative notes).
- **[TeaBuddy](./teabuddy.md):** An unrelated, separate product that uses simple single-device BLE rather than a mesh network; codebases and team integrations are kept separate per Sam Rivera's guidance.

---

## Related Concepts

- **MeshSync:** A custom local mesh protocol created to extend sensor range without a cloud backbone.
- **Local [MQTT Export](./mqtt-export.md):** Schema structures telemetry, battery, and neighbor information locally (`aurora/{device_id}/telemetry`).
- **BLE Proxy Updates:** Phone app-based [firmware updates](./firmware-updates.md) utilized when a mesh node is unreachable.

---

## Contradictions

&gt; **Contradiction:** [Battery Specifications](./battery-specifications.md)
&gt; Early kickoff [meeting notes](./meeting-notes.md) and goals targeted a 2-year lifespan on a CR2032 battery with hourly readings. Later design specs and fragments modify engineering expectations to 18 months at 10 nodes using a 15-minute read interval. Furthermore, some legacy documents incorrectly referenced a CR2450 battery, which hardware revision specs explicitly corrected as a misprint.

&gt; **Contradiction:** Default Read Interval
&gt; Kickoff notes and initial drafts specified hourly readings to preserve power, whereas hardware revision C specifications, MQTT export documentation, and markdown export fragments establish the default read interval at 15 minutes.

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

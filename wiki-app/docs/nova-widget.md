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
last_updated: "2026-09-02T06:41:06.792717+00:00"
sidebar_label: Nova Widget
slug: /nova-widget
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Nova Widget

## Overview

The **[Nova](./aurora-nova-widget-v2.md) Widget** (developed under the working name **[Aurora Nova Widget v2](./aurora-nova-widget-v2.md)**) is an open-source, local-first [IoT](./iot.md) sensor designed by [Aurora Labs](./aurora-labs.md) for home gardeners and small-acreage farmers. Guided by the mission statement *"Open [sensors](./sensors.md) for people who own their data,"* the device features no mandatory cloud accounts, no camera, and no GPS, instead relying on direct local exports via CSV or [MQTT](./mqtt.md) (compatible with [Home Assistant](./home-assistant.md)). 

The device core features:
- Capacitive soil moisture sensing
- Air temperature monitoring
- Ambient light detection via a simple photodiode
- [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) for phone setup and a custom mesh network protocol called **[MeshSync](./meshsync.md)** for extended range

---

## Key Details

### Hardware & Electrical Specifications
- **Microcontroller (MCU):** nRF52840
- **Enclosure:** 3D-printed PETG (pebble shape) with a silicone 50A gasket providing an IP54 splash rating (an IP65 variant was deferred due to tooling costs).
- **[Battery Specifications](./battery-specifications.md):** Powered by a CR2032 coin cell ([Hardware](./hardware.md) Revision C includes a revised holder to fix battery rattle). 
- **Power Profile:** 
  - Sleep current: 4.2 µA
  - Sample + TX current: 12 mA peak

### Firmware & Networking
- **Mesh Protocol:** Custom protocol named **MeshSync**, designed by [Mira Chen](./aurora-nova-widget-v2.md). It supports a theoretical maximum of 32 nodes (though [beta testing](./beta-testing.md) noted instability past 8 nodes, and developers recommend flashing [firmware](./firmware.md) version 0.3.9 before adding more than 6 nodes to prevent relay [battery drain](./battery-drain.md) issues).
- **Reading Intervals:** The default read interval is **15 minutes** (updated from the initial hourly kickoff proposal).
- **[OTA Updates](./ota-updates.md):** Signed firmware images using ed25519 with rollback protection. Over-the-air updates support BLE proxying via a phone app when a mesh node is unreachable, though OTA is not shipping in the initial beta phase.
- **Local Data Export:** Optional local MQTT telemetry publishing follows the topic structure `aurora/{device_id}/telemetry`, `aurora/{device_id}/battery`, and `aurora/{device_id}/mesh/neighbors`.

---

## Related Entities

- **Aurora Labs:** The organization founded by Mira Chen and Jonah Park.
- **Mira Chen:** Co-founder responsible for firmware, the [MeshSync protocol](./meshsync-protocol.md), and power profiling.
- **Jonah Park:** Co-founder responsible for PCB design, sensors, and mechanical hardware.
- **[TeaBuddy](./teabuddy.md):** An unrelated, single-device BLE product by Sam Rivera that uses simple BLE DFU and does not share codebases with Aurora Labs.
- **[SenseNode](./sensenode-sn-400.md) (SN-400):** A competitor comparison reference noted for having a superior IP67 waterproof rating.

---

## Related Concepts

- **MeshSync:** The proprietary multi-hop local [mesh networking](./mesh-networking.md) protocol used by Nova Widget nodes.
- **Local-First IoT:** A design philosophy emphasizing local data export (MQTT/CSV) over mandatory cloud dashboard subscriptions.
- **Battery Longevity:** Engineering efforts focused on achieving multi-month to multi-year lifespans on coin-cell batteries using optimized sleep and sampling intervals.

---

## Contradictions

&gt; **Contradiction:** [Battery life](./battery-life.md) projections vary across [documentation](./documentation.md). Early kickoff notes and marketing material initially targeted a **2-year lifespan on a CR2032 battery with hourly readings**, while engineering power budgets and later specifications estimate **18 months** (factoring in a 10-node mesh network and 15-minute intervals). Furthermore, older draft documents briefly referenced using a CR2450 battery, which [hardware specs](./hardware-specs.md) and labels explicitly clarify is **wrong** (misprints have caused support tickets).

&gt; **Contradiction:** The default reading interval shifted during development. The initial May kickoff notes specified **hourly readings**, whereas subsequent hardware and MQTT schema specifications standardize the default read interval to **15 minutes**.

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

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
last_updated: "2026-09-01T21:24:25.823383+00:00"
sidebar_label: Nova Widget
slug: /nova-widget
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Nova Widget

## Overview

The [Nova Widget](./nova-widget.md) Widget (developed under the working name **Nova Widget**, and referenced as the **[Aurora Nova Widget v2 beta](./nova-widget.md) unit**) is an open-source, local-first [IoT](./iot.md) sensor designed primarily for home gardeners and small-acreage farmers. Created by [Aurora Labs](./aurora-labs.md)—founded by [Mira Chen](./nova-widget.md) and Jonah Park—the product emphasizes user data ownership, operating without mandatory cloud accounts, subscriptions, or cameras/GPS. 

The sensor monitors capacitive soil moisture, air temperature, and ambient light (via a simple photodiode). It connects via [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) to a phone for setup and utilizes a custom local mesh protocol called **[MeshSync](./meshsync.md)** for range extension. Data is made available via CSV export or local [MQTT](./mqtt.md) (compatible with [Home Assistant](./home-assistant.md) hobbyist setups), avoiding any cloud broker hosting by Aurora Labs.

## Key Details

### Hardware & Mechanical Specifications
- **MCU:** nRF52840.
- **Enclosure & IP Rating:** 3D printed PETG in a pebble shape for the beta phase (with injection molding planned later). Incorporates a silicone 50A gasket providing an **IP54 splash** rating (an IP65-tooled variant was deferred due to a $7,850 quote).
- **[Sensors](./sensors.md):** Capacitive soil probe (30 mm length), air temperature sensor, and ambient light photodiode.
- **Power & Battery:** Powered by **CR2032** coin cells ([hardware](./hardware.md) revision C fixes a battery rattle present in earlier drafts). *Note: [Documentation](./documentation.md) explicitly warns against printing or using CR2450 cells, a misprint that previously caused support ticket #2201.*
- **[Power Budget](./power-budget.md):** 
  - Sleep mode target: 4.2 µA.
  - Sample + TX: 12 mA peak.
  - Rejoin spike: 110–340 µA (noted as a known issue).
  - Lifespan expectations: Marketing claims 2 years, whereas engineering estimates 18 months at 10 nodes.

### Firmware & Networking (MeshSync)
- **Mesh Protocol:** Custom protocol named **MeshSync**, led by Mira Chen. 
- **Capacity:** Theoretically supports up to 32 nodes, though [beta testing](./beta-testing.md) has successfully reached 8 nodes (with reports of instability past that point). 
- **Read Intervals:** [Firmware](./firmware.md) baseline defaults to a **15-minute** reading cycle (though initial kickoff notes targeted hourly readings).
- **Firmware Iterations:** Firmware builds such as 0.3.8 and 0.3.9 (e.g., build candidate addressing MeshSync relay [battery drain](./battery-drain.md) in [MESH-118](./mesh-118.md)) have been trialed in batch 4 beta retests.
- **OTA & Updates:** Over-the-air updates require signed firmware images (ed25519) with rollback protection, alongside a BLE proxy update feature via the phone app when a mesh node is unreachable. [OTA updates](./ota-updates.md) are not shipped in the current beta phase.

### Known Issues & Troubleshooting
- **NOVA-59 (Wifi State Loss):** Under firmware 0.3.8, unclean power losses (such as a power outage) can cause the widget to fail to rejoin home Wi-Fi, getting stuck blinking blue. Factory resetting resolves this but wipes accumulated sensor history. 
- *Workaround:* Instead of a full factory reset, users can hold the side button for 3 seconds for a soft Wi-Fi-only reset to preserve history. Setting a static DHCP reservation on the router also helps prevent connection drops due to IP changes.

## Related Entities

- **Aurora Labs:** The maker entity founded by Mira Chen and Jonah Park ("Open sensors for people who own their data").
- **Mira Chen:** Co-founder responsible for firmware, MeshSync, power profiling, and [MQTT export](./mqtt-export.md) schemas.
- **Jonah Park:** Co-founder responsible for PCB design, sensors, mechanical structures, and hardware revisions.
- **Kevin Ostrander:** Beta tester (batch 4) who reported the Wi-Fi reconnection bug (NOVA-59).
- **Sam Rivera:** Developer associated with [TeaBuddy](./teabuddy.md), who shared insights on single-device BLE DFU.

## Related Concepts

- **MeshSync:** The proprietary local mesh network protocol used by Nova Widget nodes to extend range without cloud dependency.
- **Local MQTT Export:** Optional local telemetry schema publishing topics like `aurora/{device_id}/telemetry`, `aurora/{device_id}/battery`, and `aurora/{device_id}/mesh/neighbors` for Home Assistant compatibility.
- **BLE Proxy Update:** A mechanism allowing phone apps to update unreachable mesh nodes.

## Contradictions

&gt; **Contradiction:** Discrepancies exist regarding the default data sampling intervals. Early kickoff notes and slides specified **hourly** readings to meet a 2-year battery target, whereas technical specifications, hardware revision C baseline, and MQTT schema drafts state a **15-minute** reading cycle.

&gt; **Contradiction:** Battery cell specifications experienced documentation conflicts. While initial brainstorming and incorrect notes referenced CR2450 batteries, engineering specs, hardware revision C notes, and manufacturing guidelines explicitly clarify that the device uses **CR2032** cells and warn that referencing CR2450 is incorrect.

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

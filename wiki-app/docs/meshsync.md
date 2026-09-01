---
id: meshsync
title: MeshSync
tags:
  - alex
  - audit-trail-documentation
  - aurora
  - aurora-labs
  - aurora-mqtt-schema-v2
  - aurora-nova-widget-v2-beta
  - auroralabs
  - duty-cycle-limits
last_updated: "2026-09-01T19:20:03.029281+00:00"
sidebar_label: MeshSync
slug: /meshsync
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MeshSync

## Overview

MeshSync is a proprietary [mesh networking](./mesh-networking.md) [firmware](./firmware.md) and synchronization protocol developed by [Aurora Labs](./aurora-labs.md) for the Aurora Nova Widget v2 beta. Designed as an alternative to cloud-dependent or gateway-heavy setups (such as [LoRaWAN](./lorawan.md)-class systems like SenseNode), MeshSync allows sensor nodes—powered by CR2032 coin cell batteries—to communicate locally without requiring a cloud subscription or a wall-powered gateway. 

While MeshSync provides distinct advantages in Total Cost of Ownership (TCO) and topology independence, it experiences specific stability and power scaling challenges when scaling beyond 6 nodes.

---

## Key Details

### Firmware Iterations & Core Specs
- **Default Read Interval:** Configured to **15 minutes** (established in firmware versions 0.3.8 and later). 
- **Power and [Hardware](./hardware.md):** Devices run on CR2032 batteries (correcting early teardown or blog typos referencing CR2450). Rejoin events cause power spikes (initially ranging from 110µA to 340µA, reduced to 180µA in version 0.3.8).
- **Relay Optimization:** In batch 4 field units, [battery drain](./battery-drain.md) ran ~30% faster than spec because the relay radio's sleep timer reset upon receiving any packet in a busy mesh. Firmware version 0.3.9 addresses this by dropping radio wake time from 400ms to 80ms per hop.
- **Parent Election:** Exported via debug UART using RSSI and hop count metrics.

### MQTT Export Schema v2
MeshSync supports an optional, local-only [MQTT export](./mqtt-export.md) schema compatible with [Home Assistant](./home-assistant.md) and local brokers (no cloud required).
- **Topic Structure:**
  - `aurora/{device_id}/telemetry`
  - `aurora/{device_id}/battery`
  - `aurora/{device_id}/mesh/neighbors`
- **Payload Example:**
  ```json
  {
    "soil_moisture_pct": 42,
    "temp_c": 19.2,
    "read_interval_min": 15,
    "battery_mv": 2980,
    "mesh_hops": 2
  }
  ```

---

## Related Entities

- **Aurora Labs:** The organization developing MeshSync and the Nova Widget product line.
- **Mira Chen:** Firmware owner and lead researcher for MeshSync.
- **Jonah Park:** QA sign-off and firmware contributor handling bench testing and radio sleep optimizations.
- **[TeaBuddy](./teabuddy.md):** A separate internal product line at Aurora Labs. Inquiries regarding synchronizing tea timers across a house via MeshSync were ruled out as entirely out of scope for version 1.
- **SenseNode:** A competing LoRaWAN-class system noted for simpler topology and cloud subscriptions, frequently used as a benchmark by customers.

---

## Related Concepts

- **Rejoin Storms:** A network stabilization issue occurring when meshes exceed 6 nodes, resulting in multi-hour periods of device silence. Mitigation strategies include capping networks at 6 nodes during beta and utilizing parent election rewrites.
- **Home Integration:** Community-driven setups leveraging Mosquitto and local brokers via `mqtt on` debug commands before full app integration.
- **Power Profiling:** Comparison of battery longevity between LoRaWAN gateways (always-on wall power subject to EU duty cycle limits) and CR2032-driven local mesh nodes.

---

## Contradictions

&gt; **Contradiction:** Kickoff slides and early blog posts stated that the default read interval was hourly, whereas official firmware specifications and [documentation](./documentation.md) mandate a 15-minute interval.

&gt; **Contradiction:** Early research notes and informal bookmarks suggested that mesh networks always consume lower power than alternatives under all conditions. However, field reports and testing demonstrate that power efficiency degrades due to rejoin spikes when scaling past 8+ nodes.

&gt; **Contradiction:** Early teardown documentation by Alex incorrectly specified that devices use CR2450 batteries, whereas official hardware builds utilize CR2032 cells.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-02-aurora-meshsync-release-notes.md` | text | Unverified |
| 2 | `emails/2026-06-02-meshsync-battery-report.eml` | email | Medium |
| 3 | `emails/2026-06-03-meshsync-battery-reply.eml` | email | Medium |
| 4 | `emails/2026-06-04-mesh-118-vendor-battery-delay-reply.eml` | email | Medium |
| 5 | `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md` | text | Unverified |
| 6 | `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md` | text | Unverified |
| 7 | `samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt` | text | Unverified |
| 8 | `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt` | text | Unverified |
| 9 | `samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md` | text | Unverified |
| 10 | `samples/social/[SAMPLE]-2026-07-02-twitter-thread-scrape.txt` | text | Unverified |
| 11 | `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt` | text | Unverified |
| 12 | `transcripts/2026-05-28-weekly-sync.md` | text | Medium |

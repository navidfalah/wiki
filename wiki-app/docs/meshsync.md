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
last_updated: "2026-09-10T14:39:21.322295+00:00"
sidebar_label: MeshSync
slug: /meshsync
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MeshSync

## Overview

[MeshSync](./meshsync.md) is a proprietary [mesh networking](./mesh-networking.md) protocol and [firmware](./firmware.md) component developed by [Aurora Labs](./aurora-labs.md) for the [Aurora Nova Widget v2 beta](./aurora-nova-widget-v2.md). Designed to eliminate the need for cloud subscriptions or always-on wall-powered gateways, MeshSync enables sensor nodes to communicate locally using CR2032 coin cell batteries. 

While it provides advantages in total cost of ownership (TCO) and infrastructure simplicity over alternatives like [LoRaWAN](./lorawan.md), MeshSync experiences scaling instabilities and power spikes when networks grow beyond six nodes.

---

## Key Details

### Firmware and Releases
- **Firmware 0.3.8:** Released on July 2, 2026 (led by firmware owner [Mira Chen](./aurora-nova-widget-v2.md) and QA sign-off Jonah Park), featuring rejoin storm mitigations, exported parent election logging (RSSI and hop count via debug UART), and optimized power behavior.
- **[Firmware 0.3.9](./firmware-039.md) (Milestone Moved Up):** Developed to address persistent rejoin storms and include a full parent election rewrite following field [testing](./testing.md) on batch 4 and batch 5 units.
- **Power and Battery Impact:** Under normal operations, nodes utilize a CR2032 coin cell battery. Rejoin events historically caused power spikes from 110µA to 340µA (reduced to 180µA in 0.3.8, with targets striving for 110µA). Relay radios staying awake between hops also caused rapid [battery drain](./battery-drain.md) (addressed via [MESH-118](./mesh-118.md) to reduce radio wake time from 400ms to 80ms per hop).
- **Read Interval:** The default read interval is **15 minutes**. 

### MQTT Export Schema v2
MeshSync supports an optional, local-only [MQTT export](./mqtt-export.md) schema compatible with [Home Assistant](./home-assistant.md) and local brokers without requiring cloud hosting:
- **Topic Structure:**
  - `aurora/{device_id}/telemetry`
  - `aurora/{device_id}/battery`
  - `aurora/{device_id}/mesh/neighbors`
- **Sample Payload:**
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

- **Aurora Labs:** The organization developing the Nova Widget and MeshSync technology.
- **Mira Chen:** Firmware lead and primary technical contact for MeshSync development and vendor cell management.
- **Jonah Park:** QA sign-off and firmware contributor handling bench testing and radio sleep timer patches.
- **[TeaBuddy](./teabuddy.md):** A separate internal product line at Aurora Labs (focused on tea timers and kitchen automation); explicitly out of scope for MeshSync v1 integration.
- **[SenseNode](./sensenode.md):** A competing LoRaWAN-class [sensor hardware](./sensor-hardware.md) class utilizing EU duty cycle limits and gateway infrastructure, frequently used as a benchmark by community users and [support tickets](./support-tickets.md).

---

## Related Concepts

- **Rejoin Storms:** A network destabilization condition occurring when mesh size exceeds 6 nodes, resulting in multi-hour reporting silences that currently require node caps or power cycling.
- **Parent Election:** The protocol mechanism by which nodes select their routing parents within the mesh, logged via RSSI and hop counts.
- **[Homelab](./homelab.md) Integration:** Local automation [configuration](./configuration.md) via Mosquitto and Home Assistant using the Aurora MQTT schema v2.

---

## Contradictions

&gt; **Contradiction:** Kickoff slides and old blog posts initially stated that the default read interval would be hourly, and some [documentation](./documentation.md) mentioned batching readings hourly. However, the official firmware specification and active schema enforce a **15-minute** reading cycle.

&gt; **Contradiction:** Early [marketing](./marketing.md) materials and rough research bookmark tabs suggested that mesh [power consumption](./power-consumption.md) is universally lower than LoRaWAN under all conditions. In practice, field data and support ticket #2099 demonstrate that rejoin power spikes and relay modes cause mesh efficiency to degrade past 8 nodes, making lower power claims false at scale today.

&gt; **Contradiction:** An independent teardown by Alex incorrectly claimed that units use CR2450 batteries. Aurora Labs documentation and [hardware specs](./hardware-specs.md) confirm that MeshSync nodes run strictly on **CR2032** coin cells.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `2026-07-02-aurora-meshsync-release-notes.md` | text | Medium |
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

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
last_updated: "2026-09-02T06:40:52.677057+00:00"
sidebar_label: MeshSync
slug: /meshsync
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MeshSync

## Overview

MeshSync is a [mesh networking](./mesh-networking.md) [firmware](./firmware.md) and synchronization system developed by [Aurora Labs](./aurora-labs.md) for the [Aurora Nova Widget v2 beta](./aurora-nova-widget-v2.md) (and related devices). It is designed to provide local, non-cloud-dependent sensor data aggregation, leveraging a peer-to-peer mesh topology powered by CR2032 coin cell batteries per node. While MeshSync offers benefits such as avoiding subscription fees and eliminating the need for an always-on gateway wall wart, it faces challenges with stability, power spikes, and rejoin storms at scale.

## Key Details

- **Firmware Versions:** Firmware version 0.3.8 introduced rejoin storm mitigation for meshes exceeding 6 nodes, parent election logging via debug UART, and local [MQTT export](./mqtt-export.md) schema v2 support. Version 0.3.9 is in development with a planned parent election rewrite to address multi-hour outages at 8+ nodes.
- **Read Intervals:** The default read interval is **15 minutes**. 
- **Power and Battery:** 
  - Nodes use **CR2032** batteries (older [documentation](./documentation.md) or teardowns incorrectly referenced CR2450 or estimated a 2-year lifespan, whereas engineering estimates closer to 18 months at 10 nodes).
  - Rejoin power spikes reduce efficiency (previously dropping from 340µA to 180µA, remaining above the 110µA target).
  - In relay mode, [battery drain](./battery-drain.md) increases roughly 30% faster than spec because the relay radio sleep timer resets on every received packet. A draft fix in [MESH-118](./mesh-118.md) drops radio wake time from 400ms to 80ms per hop.
- **MQTT Export Schema v2:** An optional local broker feature compatible with [Home Assistant](./home-assistant.md) hobbyist setups. Standard topic structures include:
  - `aurora/{device_id}/telemetry`
  - `aurora/{device_id}/battery`
  - `aurora/{device_id}/mesh/neighbors`
- **Known Issues:** 
  - Deployments with 8 or more nodes experience instability and multi-hour network silence (rejoin storms), tracked under ticket #2099 and GitHub issue #442. 
  - Workaround involves capping deployments at 6 nodes during the beta phase.

## Related Entities

- **Aurora Labs:** The organization developing MeshSync and the Nova Widget line.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Firmware owner and lead engineer working on MeshSync performance, battery tests, and vendor logistics.
- **Jonah Park:** QA sign-off and engineering lead handling bench tests, sleep timers, and parent election rewrites.
- **Alex:** Teardown author who incorrectly noted the use of CR2450 batteries instead of CR2032.
- **[TeaBuddy](./teabuddy.md) / TeaBuddyHQ:** A separate kitchen/appliance project whose team inquired about syncing tea timers across a house using MeshSync (deemed out of scope for Aurora v1).
- **[SenseNode](./sensenode-sn-400.md):** A competing [LoRaWAN](./lorawan.md)-class sensor network product utilizing gateway wall warts and subscription services.

## Related Concepts

- **Aurora MQTT Schema v2:** Local broker export standard providing JSON telemetry packets containing metrics such as `soil_moisture_pct`, `temp_c`, `battery_mv`, and `mesh_hops`.
- **Duty Cycle Limits:** Regulatory and performance constraints (such as those affecting LoRaWAN in Europe) contrasted against local mesh behavior.
- **Audit Trail Documentation:** The internal tracking requirements for part shipments, air freight surcharge waivers, and specification changes.
- **Home Assistant Integration:** Community-driven and local-broker setups utilizing Mosquitto and MQTT topic subscriptions for Nova Widgets.

## Contradictions

&gt; **Contradiction:** 
&gt; - **Read Intervals:** Kickoff slides and old blog posts stated an hourly read interval, whereas the official specification and firmware default enforce a **15-minute** reading cycle.
&gt; - **Mesh Power Efficiency:** Initial research bookmark notes claimed mesh configurations always exhibit lower [power consumption](./power-consumption.md) than LoRaWAN, which is proven false at scale when operating with 8+ nodes due to rejoin and relay power spikes.
&gt; - **Battery Spec:** Marketing and early design materials (including Alex's teardown) suggested a 2-year [battery life](./battery-life.md) and CR2450 cells, while engineering assessments specify an 18-month lifespan using CR2032 coin cells.

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

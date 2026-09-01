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
last_updated: "2026-09-01T21:24:10.732542+00:00"
sidebar_label: MeshSync
slug: /meshsync
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MeshSync

## Overview

MeshSync is a proprietary mesh synchronization [firmware](./firmware.md) and communication protocol developed by [Aurora Labs](./aurora-labs.md) for the [Aurora Nova Widget v2 beta](./nova-widget.md) and related [hardware](./hardware.md). It enables multi-node sensor communication (such as soil moisture and temperature telemetry) without requiring a cloud subscription or an always-on gateway wall wart. MeshSync relies on CR2032 coin cell batteries per node and supports local integration through optional [MQTT export](./mqtt-export.md) schema v2.

## Key Details

- **Default Read Interval:** Configured to **15 minutes** for reading cycles.
- **Power & [Battery Life](./battery-life.md):** Uses CR2032 batteries (earlier teardowns or typos incorrectly referenced CR2450). Engineering estimates 18 months of battery life at 10 nodes, while marketing references up to 2 years. Rejoin operations cause [power consumption](./power-consumption.md) spikes (historically dropping from 340µA to 180µA in firmware 0.3.8, with targets near 110µA).
- **Scalability and Known Issues:** 
  - Officially recommended to cap deployments at **6 nodes** during beta to prevent rejoin storms and multi-hour network silence.
  - Expanding to 8+ nodes remains unstable in field reports (tracked under ticket #2099 and GitHub issue #442).
  - Firmware 0.3.9 introduces a parent election rewrite to address rejoin loops and reduce relay radio wake times from 400ms to 80ms per hop.
- **MQTT Export Schema v2:** An optional, local-only export feature compatible with [Home Assistant](./home-assistant.md) setups. Topic structures include `aurora/{device_id}/telemetry`, `aurora/{device_id}/battery`, and `aurora/{device_id}/mesh/neighbors`.

## Related Entities

- **[Mira Chen](./nova-widget.md):** Firmware owner and lead engineer.
- **Jonah Park:** QA sign-off and firmware contributor handling hardware bench testing and radio sleep optimizations.
- **Alex:** Teardown author who previously misidentified [battery specifications](./battery-specifications.md).
- **[TeaBuddy](./teabuddy.md) / TeaBuddyHQ:** A separate kitchen/appliance project exploring tea timer synchronization, which is explicitly out of scope for Aurora v1.
- **[SenseNode](./sensenode-sn-400.md):** A competing [LoRaWAN](./lorawan.md)-class sensor solution utilizing gateway wall power and subscription models, serving as a comparison point for mesh complexity.

## Related Concepts

- **Parent Election:** The mechanism by which nodes discover and connect to network parents, logged via debug UART (RSSI + hop count).
- **Rejoin Storms:** Network congestion and latency issues that occur when multiple nodes attempt to reconnect or re-elect parents simultaneously at scale (8+ nodes).
- **Local MQTT Export:** Broker-less telemetry integration allowing users to ingest data directly into [home automation](./home-automation.md) platforms like Home Assistant.

## Contradictions

&gt; **Contradiction:** Kickoff slides and old blog posts incorrectly stated that the default read interval was **hourly**, whereas the official specification and firmware defaults mandate a **15-minute** interval.

&gt; **Contradiction:** Early research notes and promotional materials assumed mesh networks inherently draw lower power across all scales; however, real-world deployment data demonstrates that rejoin storms and relay radio wake behavior make mesh power consumption higher than alternative setups at 8+ nodes.

&gt; **Contradiction:** An early teardown by Alex suggested the hardware used a CR2450 battery, whereas engineering [documentation](./documentation.md) and product specs confirm the use of a CR2032 cell.

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

---
id: aurora-labs
title: Aurora Labs
tags:
  - alex
  - alex-kim
  - aurora
  - aurora-labs
  - battery-life-claims
  - beta-testing-program
  - bridge-financing
  - cheapoco
last_updated: "2026-09-10T14:36:58.595782+00:00"
sidebar_label: Aurora Labs
slug: /aurora-labs
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Aurora Labs

## Overview

[Aurora](./aurora-nova-widget-v2.md) Labs is an open-sensor [IoT](./iot.md) [hardware](./hardware.md) company founded by [Mira Chen](./aurora-nova-widget-v2.md) and Jonah Park after meeting at a local maker faire. Frustrated by commercial [IoT sensors](./iot-sensors.md) that fail within months and enforce proprietary cloud accounts, they established the company with the mission statement: *"Open sensors for people who own their data."* Their flagship product is the **[Nova Widget](./nova-widget.md)**, a pebble-shaped sensor designed primarily for home gardeners and small-acreage farmers.

## Key Details

### The Nova Widget & Technical Specs
- **Core Hardware:** Built around the nRF52840 MCU, featuring capacitive soil moisture sensing, air temperature monitoring, and ambient light detection via a simple photodiode.
- **Connectivity:** [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) is utilized for initial phone setup, while a custom mesh protocol called **[MeshSync](./meshsync.md)** extends range between nodes. 
- **Read Intervals:** Default read intervals are set to **15 minutes** (with hourly intervals deprecated following kickoff adjustments).
- **Power & Battery:** Powered by a **CR2032** coin cell battery. Engineering estimates practical [battery life](./battery-life.md) at 18 months under a 10-node deployment, though [marketing](./marketing.md) rounds and targets up to 2 years.
- **Enclosures:** Current beta units ship with a 3D-printed PETG enclosure offering IP54 splash resistance. Full IP65 injection-molded tooling ($8k cost) has been temporarily deferred pending bridge financing or tooling funds.

### MeshSync Firmware
- **[Firmware](./firmware.md) Version:** 0.3.8 released in July 2026.
- **Node Limitations:** While the protocol header supports up to 32 nodes, beta stability is officially recommended for up to 6 nodes (with 8-node deployments improving via rejoin storm mitigations and RSSI-weighted parent election logging).

## Related Entities

- **Founders:** Mira Chen (firmware, power profiling, and CEO voice) and Jonah Park (PCB, sensors, [mechanical design](./mechanical-design.md), and enclosure aesthetics).
- **Competitors:** 
  - **[SenseNode](./sensenode.md) ([SN-400](./sensenode.md)):** Outdoor waterproof competitor utilizing [LoRaWAN](./lorawan.md), required cloud subscriptions, and an IP67 rating (compared against Aurora's subscription-free local mesh and IP54 beta rating).
  - **CheapoCo (SoilStick):** USB-powered Wi-Fi competitor.
- **[TeaBuddy](./teabuddy.md):** A kitchen/lifestyle brand making local-only tea timer pucks ([TeaBuddy Puck](./teabuddy.md)). Led by Alex Kim, the relationship is strictly limited to friendly community banter, co-marketing discussions, and stress-ball gifts, with formal product integrations explicitly rejected as out-of-scope.

## Related Concepts

- **[MeshSync Protocol](./meshsync-protocol.md):** The custom multi-hop routing and parent election protocol created to link Nova Widgets without requiring external Wi-Fi routers or cloud infrastructure.
- **Data Sovereignty:** The core design philosophy emphasizing local-only data exports (CSV and local [MQTT](./mqtt.md) broker support) without mandatory subscription dashboards.
- **[Beta Testing](./beta-testing.md) Program:** A field-testing initiative encompassing 47+ units, relying on community feedback from [homelab](./homelab.md) forums and maker events.

## Contradictions

&gt; **Contradiction:** Early [documentation](./documentation.md), kickoff slides, and draft materials occasionally cited an hourly read interval or a CR2450 battery (such as an early Amazon draft and an old blog post by Alex/Aurora Labs). Official specs and [firmware updates](./firmware-updates.md) have corrected these to a **15-minute default read interval** and a **CR2032 battery**. Additionally, engineering projects an 18-month battery life at 10 nodes, while marketing materials continue to advertise a 2-year target.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `2026-07-02-aurora-meshsync-release-notes.md` | text | Medium |
| 2 | `notes/2026-05-01-kickoff-notes.md` | text | Medium |
| 3 | `samples/2026-07-04-investor-update-draft.txt` | text | Unverified |
| 4 | `samples/articles/[SAMPLE]-2026-07-09-competitive-landscape-q3.md` | text | Unverified |
| 5 | `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt` | text | Unverified |
| 6 | `samples/notes/[SAMPLE]-2026-07-01-aurora-standup.txt` | text | Unverified |
| 7 | `samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt` | text | Unverified |
| 8 | `samples/social/[SAMPLE]-2026-07-02-twitter-thread-scrape.txt` | text | Unverified |
| 9 | `samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt` | text | Unverified |
| 10 | `samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt` | text | Unverified |

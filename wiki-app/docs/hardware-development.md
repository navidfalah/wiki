---
id: hardware-development
title: Hardware Development
tags:
  - alex
  - alex-kim
  - aurora
  - aurora-labs
  - auroralabs
  - battery-state-indicator
  - ble-vs-mesh-tradeoffs
  - bridge-financing-ask
last_updated: "2026-09-10T14:38:24.572218+00:00"
sidebar_label: Hardware Development
slug: /hardware-development
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Development

## Overview
[Hardware](./hardware.md) development at [Aurora Labs](./aurora-labs.md) focuses on creating open, [local-first](./local-first.md) [IoT sensors](./iot-sensors.md) for home gardeners and small-acreage farmers who want to own their data without being forced into a cloud subscription. The flagship product, the **[Nova Widget](./nova-widget.md)**, is designed to feel like traditional garden equipment rather than surveillance technology. The initial v1 scope tracks soil moisture (via capacitive probes), air temperature, and ambient light, relying on [BLE](./ble.md) for setup and a custom mesh protocol (**[MeshSync](./meshsync.md)**) for range extension.

## Key Details
- **Microcontroller:** nRF52840 (leveraging Jonah Park's existing dev boards).
- **Mesh Protocol:** Custom protocol named **MeshSync** (prototype developed by [Mira Chen](./aurora-nova-widget-v2.md); stable up to 8 nodes, though node rejoins cause a temporary 110 µA current spike).
- **Power Target:** Designed for a 2-year lifespan on a CR2032 battery cell.
- **Enclosure:** 3D-printed PETG for the beta phase, with injection molding planned for later scaling if bridge financing is secured.
- **Weatherproofing:** The beta units achieve an IP54 rating using gasket samples. Achieving IP65 requires an $8k tooling rip, which was deferred for the beta launch.
- **Connectivity & Data:** No camera, GPS, or mandatory cloud dashboard is included. Data export is handled via optional [MQTT](./mqtt.md) or CSV.

## Related Entities
- **Aurora Labs:** The company founded by Mira Chen and Jonah Park, created to build open sensors.
- **Mira Chen:** Co-founder handling [firmware](./firmware.md), MeshSync development, and power profiling.
- **Jonah Park:** Co-founder managing PCBs, sensors, and [mechanical design](./mechanical-design.md).
- **Alex Kim:** Founder of [TeaBuddy](./teabuddy.md) and guest speaker at Aurora Labs' lunch-and-learns, collaborating informally on supply chains and co-[marketing](./marketing.md) ideas.

## Related Concepts
- **MeshSync:** The proprietary [mesh networking](./mesh-networking.md) protocol used to extend range across multiple Nova Widget nodes.
- **Local-First IoT:** Design philosophy emphasizing data ownership, optional local exports (MQTT/CSV), and the absence of mandatory cloud accounts.
- **Battery Optimization:** Managing low-power sleep modes and discharge curves for CR2032 cells to meet longevity goals.

## Contradictions
&gt; **Contradiction:** There is an unresolved discrepancy regarding the intended reading frequency for beta testers. The kickoff notes state an hourly reading target, whereas team transcripts and spec reminders point to 15-minute defaults. This needs to be resolved before final rollout to beta testers.

&gt; **Contradiction:** Internal marketing and technical [documentation](./documentation.md) show conflicting [battery life](./battery-life.md) assertions, mixing claims between a 2-year lifespan and an 18-month timeline. A [power budget](./power-budget.md) spreadsheet is scheduled for publication to clarify these targets.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |
| 2 | `ideas/backlog-shower-thoughts.txt` | text | Medium |
| 3 | `notes/2026-05-01-kickoff-notes.md` | text | Medium |
| 4 | `notes/2026-06-01-standup-scribbles.txt` | text | Medium |
| 5 | `notes/2026-06-10-fragmented-research.txt` | text | Medium |
| 6 | `notes/TEST-slack-dump.txt` | text | Medium |
| 7 | `samples/2026-07-04-investor-update-draft.txt` | text | Unverified |
| 8 | `samples/notes/[SAMPLE]-2026-07-05-lunch-and-learn-notes.txt` | text | Unverified |
| 9 | `samples/social/[SAMPLE]-2026-07-02-twitter-thread-scrape.txt` | text | Unverified |
| 10 | `transcripts/2026-05-28-weekly-sync.md` | text | Medium |

---
id: hardware-development
title: Hardware Development
tags:
  - alex-kim
  - aurora-labs
  - battery-state-indicator
  - ble-vs-mesh-tradeoffs
  - bridge-financing
last_updated: "2026-09-01T19:18:57.426451+00:00"
sidebar_label: Hardware Development
slug: /hardware-development
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Development

## Overview

[Hardware](./hardware.md) development at [Aurora Labs](./aurora-labs.md) centers on the **[Nova Widget](./nova-widget.md)**, an open-source [IoT](./iot.md) sensor designed for home gardeners and small-acreage farmers who want to own their data without relying on mandatory cloud accounts or subscription dashboards. Founded by [Mira Chen](./aurora-labs.md) and Jonah Park in Portland, Oregon, the project emphasizes local-first data access (via [MQTT export](./mqtt-export.md) or CSV), rugged outdoor usability, and long-term battery efficiency.

## Key Details

### Product Specifications & Hardware Choices
- **Working Name:** Nova Widget
- **Target Audience:** Home gardeners and small-acreage farmers.
- **Core [Sensors](./sensors.md):** Capacitive soil moisture, air temperature, and ambient light (simple photodiode).
- **MCU & Connectivity:** Built on the nRF52840 microcontroller, featuring [Bluetooth Low Energy](./bluetooth-low-energy.md) ([BLE](./ble.md)) for phone setup and a custom mesh protocol called **MeshSync** for range extension.
- **Enclosure & Weatherproofing:** Initial beta units use 3D-printed PETG (with plans for injection molding if bridge financing is secured). Due to an $8,000 tooling cost for IP65 injection molding, beta units are shipping with IP54 water-resistance and clear splash-resistance disclaimers. 
- **Power & Battery:** Designed to run on a CR2032 coin cell battery. Devices feature a color-coded LED battery state indicator to signal low power status.

### Software & Mesh Networking
- **[MeshSync Protocol](./meshsync-protocol.md):** Custom [mesh networking](./mesh-networking.md) protocol developed by Mira Chen. Version 0.3.8 introduced rejoin fixes, successfully unblocking 8-node deployments (though recommended for 6 nodes during [beta testing](./beta-testing.md)). Rejoin spikes of 110 µA have been observed.
- **Data Export:** Optional CSV export and MQTT dashboard support; cloud dashboards are intentionally non-mandatory.

### Business & Financials
- **Current Traction:** 47 beta Nova Widget units deployed in the field.
- **Funding Ask:** Seeking $500,000 in bridge financing to cover injection molding tools and add 2 full-time equivalent (FTE) [firmware](./firmware.md) engineers.

## Related Entities

- **Aurora Labs:** The parent organization/company founded by Mira and Jonah.
- **Mira Chen:** Co-founder responsible for firmware, the MeshSync protocol, and power profiling.
- **Jonah Park:** Co-founder responsible for PCBs, sensors, and [mechanical design](./mechanical-design.md).
- **Alex Kim:** Founder of [TeaBuddy](./teabuddy.md), guest speaker at local-first IoT lunch-and-learns, and collaborator on maker community co-marketing.
- **[SenseNode](./sensenode-sn-400.md) (SN-400):** Competitor product known for an outdoor waterproof narrative featuring an IP67 rating.

## Related Concepts

- **MeshSync:** The custom nRF52840 mesh networking protocol used to chain multiple Nova Widget nodes together.
- **Local-First IoT:** The design philosophy of retaining user data locally via CSV or MQTT rather than forcing mandatory cloud storage accounts.
- **BLE vs. Mesh Tradeoffs:** The architectural decision to use BLE for direct phone configuration and mesh routing for broader outdoor range.
- **Power Budgeting:** Managing sleep cycles and active radio usage on an nRF52840 to achieve multi-year longevity from a CR2032 coin cell.

## Contradictions

&gt; **Contradiction:** [Documentation](./documentation.md) and team notes contain conflicting [battery life](./battery-life.md) claims, stating both 2 years and 18 months, which requires publishing an official [power budget](./power-budget.md) spreadsheet.

&gt; **Contradiction:** Team records conflict regarding reading intervals, noting both hourly and 15-minute defaults for beta testers.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |
| 2 | `dummy-test/2026-07-04-investor-update-draft.txt` | text | Unverified |
| 3 | `ideas/backlog-shower-thoughts.txt` | text | Medium |
| 4 | `notes/2026-05-01-kickoff-notes.md` | text | Medium |
| 5 | `notes/2026-06-01-standup-scribbles.txt` | text | Medium |
| 6 | `notes/2026-06-10-fragmented-research.txt` | text | Medium |
| 7 | `notes/TEST-slack-dump.txt` | text | Medium |
| 8 | `samples/notes/[SAMPLE]-2026-07-05-lunch-and-learn-notes.txt` | text | Unverified |
| 9 | `samples/social/[SAMPLE]-2026-07-02-twitter-thread-scrape.txt` | text | Unverified |
| 10 | `transcripts/2026-05-28-weekly-sync.md` | text | Medium |

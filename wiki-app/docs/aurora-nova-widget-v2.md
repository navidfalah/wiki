---
id: aurora-nova-widget-v2
title: Aurora Nova Widget v2
tags:
  - alex-rivera
  - aurora-labs
  - aurora-nova-widget-v2
  - hardware-habit
  - ip67-enclosure
  - lorawan
  - meshsync
  - nova-widget-v2
last_updated: "2026-09-01T19:17:45.581262+00:00"
sidebar_label: Aurora Nova Widget v2
slug: /aurora-nova-widget-v2
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Aurora Nova Widget v2

## Overview
The **[Aurora Nova Widget](./aurora-nova-widget.md) v2** is a pre-release beta garden sensor developed by **[Aurora Labs](./aurora-labs.md)** intended as an open, subscription-free alternative to cloud-locked commercial [sensors](./sensors.md). Evaluated during [hardware teardowns](./hardware-teardowns.md) and power profiling assessments, the device features local connectivity options and a modular mesh design, though it compromises on weatherproofing compared to industrial counterparts like the [SenseNode SN-400](./sensenode-sn-400.md).

## Key Details
- **Hardware & Enclosure:** Built using an **IP54** plastic enclosure, offering moderate weather protection that is visibly less sealed than IP67-rated alternatives.
- **Connectivity:** Utilizes an nRF52840 chip combined with a custom **MeshSync** mesh network protocol, avoiding [LoRaWAN](./lorawan.md) fees and cloud subscription locks.
- **Data Export:** Supports open [MQTT export](./mqtt-export.md), allowing local data access without requiring a user account.
- **Power & Battery:** 
  - Uses a **CR2032** coin cell battery *(Note: Initial reports incorrectly stated it used a CR2450)*.
  - Aurora Labs claims a 2-year [battery life](./battery-life.md) at 15-minute reading intervals (targeting an 85 µA baseline).
  - Independent power profiling over a 48-hour sample measured an average draw of **~92 µA** with a 3-node mesh active, yielding an independent estimated battery lifespan of **~20 months**.

## Related Entities
- **Aurora Labs:** The manufacturer and designer of the [Nova Widget v2](./nova-widget-v2.md).
- **Alex Rivera:** Hardware reviewer and author for *Hardware Habit* who conducted the teardown and power analysis.
- **SenseNode SN-400:** A competing $49 commercial garden sensor featuring an IP67 enclosure and LoRaWAN connectivity, used as a benchmark in the hardware comparison.

## Related Concepts
- **MeshSync:** A custom mesh protocol implemented by Aurora Labs that facilitates communication between nodes without relying on traditional gateway subscriptions.
- **IP54 Enclosure:** A dust-protected and splash-proof rating characteristic of the Nova Widget v2's beta plastic casing.
- **Open MQTT Export:** A protocol support feature allowing local data integration directly from the device.

## Contradictions
&gt; **Contradiction:** Discrepancies exist regarding the [battery specifications](./battery-specifications.md) and estimated longevity of the Nova Widget v2. Aurora Labs targets an 85 µA draw to achieve a 2-year battery life, whereas independent 48-hour power profiling measured an average draw of ~92 µA, resulting in an adjusted estimate of ~20 months. Additionally, early published specifications incorrectly listed the battery type as a CR2450 before being corrected to a CR2032.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |

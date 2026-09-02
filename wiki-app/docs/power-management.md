---
id: power-management
title: Power Management
tags:
  - aurora-nova-widget-v2
  - jonah-park
  - meshsync
  - mira-chen
  - parent-election
  - power-budget
  - power-management
  - sensenode-sn-400
last_updated: "2026-09-02T06:41:23.387657+00:00"
sidebar_label: Power Management
slug: /power-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Power Management

## Overview
Power management for the [Aurora Nova Widget v2 beta](./aurora-nova-widget-v2.md) unit governs energy consumption across sleep, sampling, transmission, and network rejoin states. The device is designed as an open-source soil moisture and temperature sensor utilizing the [MeshSync](./meshsync.md) local mesh network with no mandatory cloud dependency.

## Key Details
The [power budget](./power-budget.md) for the Aurora Nova Widget v2 is currently in a draft state and outlines the following consumption modes:
* **Sleep Mode:** 4.2 µA (target)
* **Sample + TX:** 12 mA peak (operating on a 15-minute interval)
* **Rejoin Spike:** 110–340 µA (identified as a known issue)

The [hardware](./hardware.md) is powered by dual CR2032 batteries. Discrepancies exist regarding expected longevity, as marketing materials claim a 2-year [battery life](./battery-life.md), whereas engineering estimates project 18 months at a 10-node capacity.

## Related Entities
* **Aurora Nova Widget v2:** The open-source beta hardware unit utilizing this power budget.
* **[Mira Chen](./aurora-nova-widget-v2.md):** [Firmware](./firmware.md) owner for the widget.
* **Jonah Park:** Hardware owner for the widget.
* **[SenseNode SN-400](./sensenode-sn-400.md):** A competitor product referenced in cross-links.
* **[TeaBuddy](./teabuddy.md):** An unrelated product mentioned during [project kickoff](./project-kickoff.md).

## Related Concepts
* **MeshSync:** The local mesh protocol used by the widget supporting a theoretical maximum of 32 nodes (beta tested unstably up to 8 nodes).
* **Parent Election:** Network routing mechanism currently marked as pending clarification (referenced on whiteboard).

## Contradictions
&gt; **Contradiction:** Marketing materials claim a 2-year battery life using dual CR2032 batteries, whereas engineering estimates limit the expected longevity to 18 months under a 10-node configuration.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |

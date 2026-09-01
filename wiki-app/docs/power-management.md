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
last_updated: "2026-09-01T19:20:37.038006+00:00"
sidebar_label: Power Management
slug: /power-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Power Management

## Overview
Power management for the [Aurora Nova Widget v2 beta](./aurora-labs.md) unit governs its [power consumption](./power-consumption.md) across different operating states, balancing power efficiency with its MeshSync local mesh functionality and sampling intervals. The product is co-owned by [Mira Chen](./aurora-labs.md) ([firmware](./firmware.md)) and Jonah Park ([hardware](./hardware.md)).

## Key Details
* **[Power Budget](./power-budget.md) (Draft):**
  * **Sleep Mode:** Target current of 4.2 µA.
  * **Sample + TX Mode:** 12 mA peak current draw, executing at 15-minute intervals.
  * **Rejoin Spike:** Known issue resulting in a current spike of **110–340 µA**.
* **[Battery Specifications](./battery-specifications.md):**
  * Uses dual CR2032 batteries (CR2032 × 2).
  * Marketing projections claim a 2-year [battery life](./battery-life.md), whereas engineering estimates an 18-month lifespan at a 10-node scale.

## Related Entities
* **Aurora Nova Widget v2 beta unit:** The open-source soil moisture and temperature sensor governed by these power specifications.
* **Mira Chen:** Firmware owner.
* **Jonah Park:** Hardware owner.
* **[SenseNode SN-400](./sensenode-sn-400.md):** Competitor product referenced in cross-links.
* **[TeaBuddy](./teabuddy.md):** Unrelated product mentioned during [project kickoff](./project-kickoff.md).

## Related Concepts
* **MeshSync:** Local [mesh networking](./mesh-networking.md) protocol utilized by the widget (supports a theoretical maximum of 32 nodes, though [beta testing](./beta-testing.md) up to 8 nodes has been unstable).
* **Parent Election:** Node hierarchy mechanism whose implementation details are currently unresolved ("??? (see whiteboard)").

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md` | text | Unverified |

---
id: product-roadmap
title: Product Roadmap
tags:
  - aurora-labs
  - battery-life-target
  - contradiction-linter
  - enclosure-rating
  - ingress-protection-ip-rating
  - jonah
  - meshsync
  - mira
last_updated: "2026-09-10T14:39:54.015446+00:00"
sidebar_label: Product Roadmap
slug: /product-roadmap
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Roadmap

## Overview

The Product Roadmap details the strategic direction, [hardware specifications](./hardware-specifications.md), [firmware](./firmware.md) configurations, and engineering milestones for [Aurora Labs](./aurora-labs.md)' flagship soil and environment sensor, the **[Nova Widget v2](./nova-widget-v2.md)**. Designed to supersede informal v1 notes, the v2 development encompasses self-healing [mesh networking](./mesh-networking.md), precise power budgets, and targeted physical enclosures.

## Key Details

### Nova Widget v2 Hardware & Firmware Specifications
- **MCU:** Nordic nRF52840 (with a spike profiling task on the nRF5340 eval board led by [Mira](./aurora-nova-widget-v2.md)).
- **[Sensors](./sensors.md):** Capacitive soil moisture, SHT41 temp/humidity, and VEML7700 light sensors.
- **Power & Battery:** Powered by a CR2032 primary cell. Jonah has advocated for an optional solar trickle charger module, though Mira has raised concerns regarding the Bill of Materials (BOM) impact.
- **Reading Interval:** Defaulted to every 15 minutes when mesh is active, configurable between 5 minutes and 24 hours via the companion app.
- **[MeshSync](./meshsync.md):** Devices organize into a self-healing mesh network with a maximum hop count of 4. A USB-powered gateway node bridges the mesh data to [MQTT](./mqtt.md). Target average current is kept under 85 µA, inclusive of mesh overhead in a 10-node deployment.
- **Enclosure:** Planned for IP54 rating during the beta phase, with an upgrade to IP65 slated for General Availability (GA) contingent on an approximate $8k gasket tooling budget.
- **Feature Status:** Over-the-air (OTA) updates are deferred to version 2.1 (though an OTA update design doc is listed as a sprint stretch goal).

### Sprint Planning & Ongoing Initiatives
- **Sprint 15 Goals:** Stabilize an 8-node mesh network and publish the official [power budget](./power-budget.md).
- **Committed Tasks:** Rejoin spike profiling (Mira), competitor comparison page update vs. [SenseNode SN-400](./sensenode-sn-400.md) (Jonah), and web scraping fixes (Intern).
- **Carried Over / Backlog:** Development of a contradiction linter for battery claims, refreshing the `index.md` [documentation](./documentation.md) ahead of investor demonstrations, and a recurring joke regarding renaming *MeshSync* to *MeshSink* (which has faced multiple rejections).

## Related Entities

- **Aurora Labs:** The parent organization developing the Nova Widget v2.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Author of the Nova Widget v2 product spec, leading MCU spike profiling, and overseeing hardware/BOM decisions.
- **Jonah:** Team member advocating for the optional solar trickle charger and managing competitive documentation against the SenseNode SN-400.

## Related Concepts

- **MeshSync:** The self-healing mesh networking protocol utilized by Aurora Labs sensors to relay telemetry data via an MQTT bridge.
- **Ingress Protection (IP Ratings):** Physical durability standards targeting IP54 for [beta testing](./beta-testing.md) units and IP65 for GA units.
- **Power Budgeting & [Battery Life](./battery-life.md) Targets:** Internal engineering targets balancing low-current consumption against frequent polling intervals.

## Contradictions

&gt; **Contradiction:** The initial kickoff notes specified an hourly default reading interval, whereas the draft [product specification](./product-specification.md) explicitly changes the default to 15 minutes to optimize beta feedback, necessitating a revalidation of the battery life projections.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-15-product-spec-draft.md` | text | Medium |
| 2 | `dummy-test/articles/2026-05-15-product-spec-draft.md` | text | Unverified |
| 3 | `samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt` | text | Unverified |

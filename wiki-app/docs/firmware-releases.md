---
id: firmware-releases
title: Firmware Releases
tags:
  - aurora-labs
  - firmware-releases
  - jonah-park
  - mira-chen
  - mqtt-export-schema-v2
  - parent-election-logging
  - rejoin-storm-mitigation
  - sam-rivera
last_updated: "2026-09-01T21:22:50.149165+00:00"
sidebar_label: Firmware Releases
slug: /firmware-releases
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Releases

## Overview
This page documents [firmware](./firmware.md) release details for [Aurora Labs](./aurora-labs.md) products, specifically tracking version updates, [release notes](./release-notes.md), breaking changes, and known issues as managed by the engineering and QA teams.

## Key Details
- **Release:** [MeshSync](./meshsync.md) firmware 0.3.8
- **Release Date:** July 2, 2026
- **Highlights:**
  - Rejoin storm mitigation implemented when the mesh exceeds 6 nodes (addressing a known issue present since [beta testing](./beta-testing.md)).
  - Parent election logging introduced, exporting RSSI and hop count via [debugging](./debugging.md) UART.
  - Power spike on rejoin successfully reduced from 340µA to 180µA (though this remains above the 110µA target).
- **Breaking Changes:**
  - The default read interval remains **15 minutes** (correcting kickoff slide errors that stated it was hourly).
  - Introduction of [MQTT Export](./mqtt-export.md) schema v2 (optional, for local brokers only).
- **Known Issues:**
  - Networks with 8 or more nodes remain unstable in field reports (tracked under ticket #2099).
  - [Battery Life](./battery-life.md) projections differ by department: engineering estimates 18 months at 10 nodes, while marketing may still advertise 2 years.

## Related Entities
- **Aurora Labs:** The organization managing the MeshSync firmware and product line.
- **[Mira Chen](./nova-widget.md):** Firmware owner for the MeshSync project.
- **Jonah Park:** QA sign-off owner.
- **Sam Rivera:** Inquired about feature feasibility.
- **[Nova Widget](./nova-widget.md):** Associated [Hardware](./hardware.md)/product tag.

## Related Concepts
- **Rejoin Storm Mitigation:** Logic and optimizations applied to handle network reconnections efficiently when mesh sizes exceed 6 nodes.
- **Parent Election Logging:** Diagnostic feature exporting metric data like RSSI and hop counts over debug UART.
- **MQTT Export Schema v2:** Updated schema format for optional local broker data exports.
- **[TeaBuddy](./teabuddy.md) Sync:** A requested feature by Sam Rivera to sync tea timers, which was deemed out of scope for Aurora v1.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-02-aurora-meshsync-release-notes.md` | text | Unverified |

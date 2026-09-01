---
id: project-management
title: Project Management
tags:
  - aurora
  - aurora-labs
  - auto-ingest
  - backlog-grooming
  - ble
  - contradiction-linter
  - cr2032
  - data-sync-frequency-contradiction
last_updated: "2026-09-01T21:25:15.118821+00:00"
sidebar_label: Project Management
slug: /project-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Project Management

## Overview
Project management activities at [Aurora Labs](./aurora-labs.md) cover [sprint planning](./sprint-planning.md), retrospectives, [bug tracking](./bug-tracking.md), and [product design](./product-design.md) decisions for [hardware](./hardware.md) and software projects like the Aurora widget. Teams actively balance hardware constraints (such as [BLE](./ble.md) mesh stability and power budgets) with software features (like optional [MQTT](./mqtt.md) exports and [wiki automation](./wiki-automation.md) ideas). Cross-product partnership ideas with [TeaBuddy](./teabuddy.md) have been consistently rejected, and persistent naming debates—such as attempting to rename [MeshSync](./meshsync.md) to MeshSink—reappear across multiple sprints.

## Key Details
- **Sprint Planning & Retrospectives:** Aurora Labs operates on structured sprints (e.g., Sprint 14 retro and Sprint 15 planning). Key goals focus on stabilizing the 8-node mesh network and publishing comprehensive [power budget](./power-budget.md) spreadsheets.
- **Hardware & Design Choices:** 
  - The [Nova widget](./nova-widget.md) enclosure follows a pebble shape designed to feel like garden equipment rather than surveillance devices.
  - PETG material is planned for beta injection molding if [fundraising](./fundraising.md) goals are met.
  - Technical explorations include comparing nRF52840 versus nRF5340 chips for upcoming hardware revisions, and profiling rejoin spikes (noting current spikes from 110µA to 340µA on parent swaps during 8-node rejoins).
- **Software & Data Features:**
  - MeshSync remains the established name despite multiple joke proposals to rename it to MeshSink.
  - [MQTT export](./mqtt-export.md) and CSV capabilities are planned as optional features, ensuring the dashboard is never mandatory per [Mira's](./nova-widget.md) requirements.
- **Wiki & Tooling Automation:** Ideas on the backlog include pre-commit hooks for contradiction markers, automated Slack export ingestion, graph diffs between compiles, LLM-summarized support tickets, and orphan page linters.

## Related Entities
- **Aurora Labs:** The primary organization conducting sprint planning and product development.
- **Mira:** Core team member who fixed a sleep regression in two hours and evaluates mesh stability limits.
- **Jonah:** Core team member who advocated for the pebble-shaped enclosure and tracks mesh telemetry with RSSI and hop counts.
- **TeaBuddy:** A separate team/product whose partnership requests and mesh tea timer ideas have been unanimously rejected by Aurora leadership.
- **[SenseNode SN-400](./sensenode-sn-400.md):** A competing device used for comparison [documentation](./documentation.md) updates.

## Related Concepts
- **MeshSync:** The core synchronization protocol/name that remains strictly preserved against repeated rename attempts.
- **BLE ([Bluetooth Low Energy](./bluetooth-low-energy.md)):** Wireless protocol utilized for [mesh networking](./mesh-networking.md) and node communication.
- **CR2032:** Standard coin cell battery reference tied to hardware power budgets.
- **Contradiction Linter:** An automated tool proposed to scan documentation and battery claims for inconsistencies.

## Contradictions
&gt; **Contradiction:** Documentation inconsistencies persist regarding data synchronization frequencies. While official specifications mandate a 15-minute sync interval, ongoing documentation errors frequently revert the default setting to hourly.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |
| 2 | `samples/ideas/[SAMPLE]-2026-07-04-wiki-automation-ideas.txt` | text | Unverified |
| 3 | `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt` | text | Unverified |
| 4 | `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt` | text | Unverified |
| 5 | `samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt` | text | Unverified |

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
last_updated: "2026-09-01T19:21:09.046994+00:00"
sidebar_label: Project Management
slug: /project-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Project Management

## Overview

Project management at [Aurora Labs](./aurora-labs.md) encompasses [sprint planning](./sprint-planning.md), retrospectives, [hardware](./hardware.md)/software design decisions, and tracking cross-product initiatives. Teams coordinate closely on [product design](./product-design.md)—such as the [Nova Widget](./nova-widget.md) enclosure and [MeshSync Protocol](./meshsync-protocol.md)—while managing feature backlogs, [beta testing](./beta-testing.md) phases, and [documentation](./documentation.md) consistency.

## Key Details

- **Sprint Planning & Retrospectives**: Regular sprints (such as Sprint 14 and Sprint 15) focus on stabilizing multi-node mesh networks (targeting 8-node stability), publishing power budgets, and profiling [power consumption](./power-consumption.md) (e.g., rejoin spikes on evaluation boards).
- **Design & Materials**: 
  - The Nova widget enclosure features an approved pebble shape designed to feel like garden equipment rather than surveillance gear.
  - Material choices for beta injection molding target PETG if future [fundraising](./fundraising.md) succeeds.
- **Protocol & Data Sync**: 
  - The MeshSync name remains unchanged despite multiple humorous attempts to rename it.
  - Optional [MQTT Export](./mqtt-export.md) and CSV dashboard support are prioritized as non-mandatory features requested by stakeholders.
- **Automation & [Wiki Management](./wiki-management.md)**: Ideas for [Wiki Automation](./wiki-automation.md) include pre-commit hooks to flag contradictions, automated Slack ingestion, graph diffs, and orphan page linters.

## Related Entities

- **Aurora Labs**: The primary organization managing the Aurora project and related hardware/software development.
- **[Mira](./aurora-labs.md)**: Team member who fixed a sleep regression and handled rejoin spike profiling.
- **Jonah**: Team member advocating for PETG beta injection molding, logging rejoin metrics, and approving the pebble-shaped enclosure.
- **[TeaBuddy](./teabuddy.md)**: A separate team/product entity; cross-product [partnerships](./partnerships.md) and shared manifesto ideas are discussed, though shared apps and mesh tea timers have been explicitly rejected.

## Related Concepts

- **MeshSync**: The underlying mesh synchronization protocol used across nodes, subject to debug sessions and rejoin storm analysis.
- **Contradiction Linter**: A proposed automated tool to catch conflicting specifications (such as battery sync intervals) before beta releases.
- **Hardware & Peripherals**: Utilization of components such as nRF52840, nRF5340, CR2032 batteries, and [BLE](./ble.md) communication.

## Contradictions

&gt; **Contradiction:** Documentation discrepancies exist regarding data synchronization frequency. While the project specification mandates a 15-minute sync interval, official documentation and some voice memos repeatedly reference an hourly default setting. This must be resolved before releasing to beta testers.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |
| 2 | `samples/ideas/[SAMPLE]-2026-07-04-wiki-automation-ideas.txt` | text | Unverified |
| 3 | `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt` | text | Unverified |
| 4 | `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt` | text | Unverified |
| 5 | `samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt` | text | Unverified |

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
last_updated: "2026-09-02T06:41:54.831979+00:00"
sidebar_label: Project Management
slug: /project-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Project Management

## Overview
Project management activities for [Aurora Labs](./aurora-labs.md) encompass [sprint planning](./sprint-planning.md), retrospectives, [bug tracking](./bug-tracking.md), and design decisions for [hardware](./hardware.md) and software projects (including the Aurora widget and [MeshSync protocol](./meshsync-protocol.md)). Team leadership consists of Jonah and [Mira](./aurora-nova-widget-v2.md), who manage [beta testing](./beta-testing.md), hardware choices like PETG injection molding, and product scoping.

## Key Details
- **Hardware & Design Decisions:** The [Nova widget](./nova-widget.md) enclosure features an approved "pebble shape" designed to feel like garden equipment rather than surveillance devices. PETG material is planned for beta injection molding if [fundraising](./fundraising.md) goals are met.
- **Mesh Network Stability:** MeshSync protocol testing has shown a rejoin storm at 8 nodes, which causes current spikes (110µA to 340µA on parent swap). Despite this, the stability is considered acceptable for beta testing.
- **Feature Scope:** Optional [MQTT export](./mqtt-export.md) with CSV support is requested by Mira, keeping dashboards non-mandatory. Joint cross-[product ideas](./product-ideas.md) or [partnerships](./partnerships.md) (such as with [TeaBuddy](./teabuddy.md) or a mesh tea timer) have been repeatedly rejected.
- **Wiki & Automation:** Current administrative and [documentation](./documentation.md) efforts focus on pre-commit hooks, auto-ingesting Slack exports, handling orphan pages, and maintaining a shared glossary covering items like CR2032 batteries, [BLE](./ble.md), and MeshSync.

## Related Entities
- **Aurora Labs:** The primary organization running Sprints 14 and 15.
- **Jonah & Mira:** Key project leads and decision-makers.
- **MeshSync:** The core mesh synchronization protocol (proposals to rename it to "MeshSink" have been rejected multiple times).
- **TeaBuddy:** A separate team/product whose partnership and feature requests have been unanimously rejected for v1.

## Related Concepts
- **Sprint Retrospectives & Planning:** Regular cadence of tracking velocity, addressing lab stability (e.g., stable at 6 nodes, working toward 8 nodes), and clearing backlog items.
- **Contradiction Management:** Automated detection and linting of inconsistencies in documentation and battery/power claims.
- **Local-First Manifesto:** Cross-product documentation initiative sharing values between Aurora and TeaBuddy.

## Contradictions
&gt; **Contradiction:** Documentation discrepancies exist regarding data sync frequencies. While the formal specification mandates a 15-minute sync interval, documentation files continue to incorrectly state an hourly default. Team voice memos and retrospectives flag this as an issue that must be fixed prior to beta release.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/voice-memo-transcription.txt` | text | Medium |
| 2 | `samples/ideas/[SAMPLE]-2026-07-04-wiki-automation-ideas.txt` | text | Unverified |
| 3 | `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt` | text | Unverified |
| 4 | `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt` | text | Unverified |
| 5 | `samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt` | text | Unverified |

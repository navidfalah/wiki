---
id: battery-drain
title: Battery Drain
tags:
  - aurora-labs
  - battery-drain
  - jonah-park
  - mesh-118
  - meshsync-relay-mode
  - mira-chen
  - read-interval
  - wiki
last_updated: "2026-09-01T19:17:52.501926+00:00"
sidebar_label: Battery Drain
slug: /battery-drain
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Battery Drain

## Overview

Batch 4 field units have been experiencing significant battery drain issues. According to field reports, units are consuming battery approximately 30% faster than specifications once MeshSync relay mode is enabled. 

## Key Details

- **Severity:** Field units draining ~30% faster than spec.
- **Trigger:** Enabled MeshSync relay mode.
- **[Firmware](./firmware.md) Version:** 0.3.8 (current default).
- **Read Interval:** Configured to 15 minutes, confirming that the issue is not caused by an interval misconfiguration.
- **Root Cause Suspect:** The relay radio is suspected to remain awake between hops instead of entering a sleep state.
- **Tracking ID:** Filed under [[MESH-118](./mesh-118.md)].

## Related Entities

- [Mira Chen](mira.chen@auroralabs.example) (Sender of the field report)
- [Jonah Park](jonah.park@auroralabs.example) (CC'd on the engineering report)
- [Aurora Labs](https://auroralabs.example) (Organization)

## Related Concepts

- MeshSync Relay Mode
- Firmware 0.3.8
- [Power Management](./power-management.md) / Radio Sleep Cycles

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-02-meshsync-battery-report.eml` | email | Medium |

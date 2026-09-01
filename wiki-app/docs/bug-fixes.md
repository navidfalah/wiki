---
id: bug-fixes
title: Bug Fixes
tags:
  - aurora-labs
  - bug-fixes
  - jonah-park
  - mesh-118
  - mira-chen
  - radio-wake-time
  - relay-radio-sleep-timer
  - wiki
last_updated: "2026-09-01T21:22:18.183468+00:00"
sidebar_label: Bug Fixes
slug: /bug-fixes
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bug Fixes

## Overview
This page documents engineering bug fixes and [firmware updates](./firmware-updates.md) related to [Aurora Labs](./aurora-labs.md) [hardware](./hardware.md) and mesh communication systems, specifically tracking issues surrounding [battery drain](./battery-drain.md) and relay radio performance in the field.

## Key Details
- **[MeshSync](./meshsync.md) Battery Drain Issue:** Investigated via field report batch 4 and confirmed on the bench by Jonah Park.
- **Root Cause:** The relay radio's sleep timer resets on every received packet, meaning a busy mesh network prevents the radio from ever entering sleep mode.
- **Ticket / Draft Fix:** Tracked under `MESH-118`.
- **Mitigation:** Drops the radio wake time from 400ms to 80ms per hop.
- **Next Steps:** A 0.3.9 candidate build is scheduled for release by Friday for [Mira Chen](./nova-widget.md) to retest on the batch 4 units.

## Related Entities
- **Jonah Park** (`jonah.park@auroralabs.example`) — Engineering team member who diagnosed the bench issue and drafted the fix.
- **Mira Chen** (`mira.chen@auroralabs.example`) — Engineering team member responsible for retesting candidate builds on field units.
- **Aurora Labs** — Organization overseeing the engineering and deployment of the units.

## Related Concepts
- **Mesh Networks:** Communication topology affected by continuous packet receipt preventing sleep cycles.
- **Radio Sleep Timers:** Low-power mechanisms disrupted by high network traffic.
- **Firmware Candidate Builds:** Version 0.3.9 release pipeline for bug validation.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-03-meshsync-battery-reply.eml` | email | Medium |

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
last_updated: "2026-09-02T06:38:55.972614+00:00"
sidebar_label: Bug Fixes
slug: /bug-fixes
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bug Fixes

## Overview
This page documents critical software bug fixes and investigations across engineering projects at [Aurora Labs](./aurora-labs.md), focusing on [hardware](./hardware.md) power optimization, mesh network performance, and [firmware](./firmware.md) release candidates.

## Key Details
- **[MeshSync](./meshsync.md) [Battery Drain](./battery-drain.md) Investigation**: Bench testing confirmed that the relay radio's sleep timer was resetting on every received packet. In a busy mesh network, this prevented the radio from ever entering a sleep state, causing excessive battery drain.
- **Ticket Reference**: [MESH-118](./mesh-118.md)
- **Proposed Fix**: The draft fix in MESH-118 reduces the radio wake time from 400ms to 80ms per hop.
- **Release Plans**: A `0.3.9` candidate build is scheduled for release to facilitate retesting on batch 4 units.

## Related Entities
- **Jonah Park**: Engineering team member who confirmed the bench test results and drafted the MESH-118 fix.
- **[Mira Chen](./aurora-nova-widget-v2.md)**: Engineering team member responsible for retesting candidate builds on batch 4 units.
- **Aurora Labs**: Organization managing the engineering teams and field report batches.

## Related Concepts
- **Mesh Networks**: Decentralized network architectures where continuous packet traffic can adversely affect node [power management](./power-management.md) if sleep timers are misconfigured.
- **Radio Sleep Timers**: Power-saving firmware features designed to power down communication hardware during idle periods.
- **Firmware Release Candidates**: Pre-production software builds subjected to targeted retesting before official deployment.

## Contradictions
*(No contradictions reported in current sources)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-03-meshsync-battery-reply.eml` | email | Medium |

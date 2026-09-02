---
id: hardware-power-management
title: Hardware Power Management
tags:
  - aurora-labs
  - hardware-power-management
  - jonah-park
  - mesh-118
  - mira-chen
  - radio-wake-time
  - relay-radio-sleep-timer
  - wiki
last_updated: "2026-09-02T06:39:47.192326+00:00"
sidebar_label: Hardware Power Management
slug: /hardware-power-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Power Management

## Overview
[Hardware](./hardware.md) [power management](./power-management.md) encompasses strategies and fixes implemented to optimize energy consumption and [battery life](./battery-life.md) across mesh network devices. Investigations into [battery drain](./battery-drain.md) issues—notably highlighted in field reports—focus on optimizing radio sleep timers and wake durations to prevent continuous power draw during heavy network activity.

## Key Details
- **Relay Radio Sleep Timer Issue:** Bench testing confirmed that the relay radio's sleep timer erroneously resets upon the receipt of every individual packet. Consequently, in a busy mesh network, the radio is kept continuously awake, leading to accelerated battery drain.
- **Proposed Fix ([MESH-118](./mesh-118.md)):** A draft fix under ticket **MESH-118** addresses the issue by dropping the radio wake time significantly, reducing it from 400ms down to 80ms per hop.
- **Release Timeline:** A [Release 0.3.9](./release-039.md) candidate build incorporating this fix is scheduled for release by Friday to allow retesting on batch 4 units.

## Related Entities
- **Jonah Park:** [Aurora Labs](./aurora-labs.md) engineer who confirmed the bench test results and drafted the MESH-118 fix.
- **Mira Chen:** [Aurora Labs](./aurora-labs.md) team member responsible for retesting candidate builds on batch 4 units.
- **Aurora Labs:** The organization developing and testing the mesh synchronization hardware and software.

## Related Concepts
- **Mesh-118:** The engineering tracking ticket for the relay radio wake time reduction.
- **Radio Sleep Timer:** The mechanism responsible for putting the hardware radio into a low-power state.
- **Radio Wake Time:** The duration the hardware radio remains active per network hop.

## Contradictions
*No contradictions currently identified in the available records.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-03-meshsync-battery-reply.eml` | email | Medium |

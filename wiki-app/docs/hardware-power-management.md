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
last_updated: "2026-09-01T21:23:08.356748+00:00"
sidebar_label: Hardware Power Management
slug: /hardware-power-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Power Management

## Overview
[Hardware](./hardware.md) [Power Management](./power-management.md) at [Aurora Labs](./aurora-labs.md) encompasses the optimization and [troubleshooting](./troubleshooting.md) of [power consumption](./power-consumption.md) across [networking](./networking.md) hardware, specifically addressing [battery drain](./battery-drain.md) issues in field units. Investigations focus on radio sleep timers, packet reception behaviors, and hop timing parameters to maximize operational lifespan.

## Key Details
* **Relay Radio Sleep Timer Issue:** Bench testing confirmed that the relay radio's sleep timer incorrectly resets upon every received packet. Consequently, a busy mesh network prevents the radio from entering sleep mode, causing severe battery drain.
* **Proposed Fix (`MESH-118`):** A draft fix under ticket [`MESH-118`](./mesh-118.md) reduces the radio wake time from 400ms down to 80ms per hop to mitigate excessive power consumption.
* **Release Schedule:** A 0.3.9 candidate build incorporating this fix is scheduled for Friday, intended for retesting on batch 4 units.

## Related Entities
* [Jonah Park](jonah-park) — Aurora Labs engineer who confirmed the bench test results and drafted the `MESH-118` fix.
* [Mira Chen](mira-chen) — Aurora Labs team member responsible for retesting the 0.3.9 candidate build on batch 4 units.
* [`MESH-118`](./mesh-118.md) — Engineering ticket tracking the radio wake time reduction.

## Related Concepts
* **Radio Wake Time:** The duration a radio remains active per hop during transmission and reception; optimized from 400ms to 80ms to save power.
* **Relay Radio Sleep Timer:** The automated timer responsible for putting the relay radio into a low-power sleep state, which was found to be perpetually resetting in busy mesh environments.
* **Mesh Networks:** Distributed wireless network topologies that experienced high battery drain due to constant packet reception resetting sleep cycles.

## Contradictions
*(No contradictions noted in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-03-meshsync-battery-reply.eml` | email | Medium |

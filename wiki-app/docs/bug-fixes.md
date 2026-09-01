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
last_updated: "2026-09-01T19:18:08.279171+00:00"
sidebar_label: Bug Fixes
slug: /bug-fixes
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bug Fixes

## Overview
This page documents bug fixes and related engineering discussions within [Aurora Labs](./aurora-labs.md), specifically tracking investigations and patches addressing performance and [hardware](./hardware.md) issues such as [battery drain](./battery-drain.md) in mesh network devices.

## Key Details
- **MeshSync [Battery Drain](./battery-drain.md) Investigation:** Confirmed on the bench that the relay radio's sleep timer erroneously resets on every received packet. As a result, a busy mesh network prevents the radio from entering sleep mode.
- **Draft Fix (`MESH-118`):** Addresses the [battery drain](./battery-drain.md) issue by reducing the radio wake time from 400ms to 80ms per hop.
- **Release Plans:** A version `0.3.9` candidate build is scheduled for testing to verify the fix on batch 4 units.

## Related Entities
- **Jonah Park:** [Aurora Labs](./aurora-labs.md) engineer who confirmed the bug on the bench and drafted the fix under `MESH-118`.
- **[Mira Chen](./aurora-labs.md):** [Aurora Labs](./aurora-labs.md) team member responsible for retesting candidate builds on batch 4 units.
- **[Aurora Labs](./aurora-labs.md):** Organization managing the engineering and field testing.

## Related Concepts
- **MeshSync:** The synchronization protocol/system affected by [battery drain](./battery-drain.md) issues during heavy network activity.
- **Relay Radio Sleep Timer:** The mechanism failing to trigger due to continuous packet reception resetting the sleep cycle.
- **Radio Wake Time:** The duration the radio remains active per network hop, optimized from 400ms down to 80ms in the bug fix.

## Contradictions
*(No contradictions reported in current sources)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-03-meshsync-battery-reply.eml` | email | Medium |

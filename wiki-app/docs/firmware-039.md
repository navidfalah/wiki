---
id: firmware-039
title: Firmware 0.3.9
tags:
  - aurora-labs
  - battery-regression-check
  - firmware-039
  - jonah-park
  - lena-ito
  - mesh-network-sizing
  - mira-chen
  - relay-radio-sleep-timer
last_updated: "2026-09-10T14:38:04.628068+00:00"
sidebar_label: Firmware 0.3.9
slug: /firmware-039
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware 0.3.9

## Overview

[Firmware](./firmware.md) 0.3.9 is a software release candidate developed by [Aurora Labs](./aurora-labs.md), primarily focused on addressing the relay radio sleep timer issue tracked under ticket [MESH-118](./mesh-118.md). A formal QA test plan for the 0.3.9 candidate was drafted by Lena Ito in June 2026 to validate [battery drain](./battery-drain.md) regressions introduced in prior versions.

## Key Details

- **Target Ticket:** MESH-118 (relay radio sleep timer fix).
- **Test Scope:** 
  - Utilizes 6 bench units across mesh network sizes of 3, 6, and 9 nodes. 
  - The 9-node [configuration](./configuration.md) purposely exceeds the flash-before warning threshold to observe degradation behavior.
  - Battery drain is measured hourly over a 48-hour period per configuration.
- **Pass Criteria:** Battery drain must remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.
- **Exclusions:** The 12-node stress configuration from the original MESH-102 ticket is excluded from this pass, as it belongs to a separate mesh-capacity workstream rather than a battery regression check.
- **Build and Results:** Built by Jonah Park, with results and a drain-rate CSV scheduled for release following the close of the 48-hour [testing](./testing.md) window.

## Related Entities

- **Lena Ito:** QA team member who authored the MESH-118 retest plan for the 0.3.9 candidate.
- **Jonah Park:** Engineering team member responsible for building the 0.3.9 candidate.
- **[Mira Chen](./aurora-nova-widget-v2.md):** CC'd on the QA standup and test plan communications.
- **Aurora Labs:** The organization developing the firmware and managing the MESH ticketing workstreams.

## Related Concepts

- **Relay Radio Sleep Timer:** The core feature/fix targeted by MESH-118 in firmware 0.3.9.
- **Battery Regression Check:** The validation process used to ensure [firmware updates](./firmware-updates.md) do not abnormally drain device batteries compared to baseline versions (such as 0.3.7).
- **Mesh Network Sizing:** Testing methodology involving varying node counts (3, 6, 9, and 12 nodes) to evaluate system stability, flash warnings, and capacity thresholds.

## Contradictions

*(No contradictions identified in the current source materials.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

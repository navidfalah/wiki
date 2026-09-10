---
id: battery-drain-testing
title: Battery Drain Testing
tags:
  - aurora-labs
  - battery-drain-testing
  - battery-regression-check
  - jonah-park
  - lena-ito
  - mesh-network-sizing
  - mira-chen
  - relay-radio-sleep-timer
last_updated: "2026-09-10T14:37:12.105202+00:00"
sidebar_label: Battery Drain Testing
slug: /battery-drain-testing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Battery Drain Testing

## Overview
[Battery drain](./battery-drain.md) [testing](./testing.md) is a critical validation process used to monitor and evaluate [power consumption](./power-consumption.md) in mesh network [hardware](./hardware.md), specifically focusing on regression checks following [firmware updates](./firmware-updates.md) like the 0.3.9 candidate addressing [MESH-118](./mesh-118.md) (relay radio sleep timer).

## Key Details
- **Test Scope:** Utilizes 6 bench units across mesh sizes of 3, 6, and 9 nodes. The 9-node [configuration](./configuration.md) intentionally exceeds the flash-before warning threshold to observe degradation behavior.
- **Duration & Measurement:** Battery drain is measured hourly for 48 hours per configuration.
- **Pass Criteria:** The drain rate must remain within 10% of the 0.3.7 baseline (established pre-relay-mode) at 6 nodes or fewer.
- **Exclusions:** The 12-node stress configuration from the original MESH-102 ticket is considered out of scope for this pass, as it belongs to a separate mesh-capacity workstream rather than a battery regression check.

## Related Entities
- **Lena Ito:** QA team member responsible for drafting the MESH-118 retest plan and coordinating test results.
- **Jonah Park:** Engineering team member responsible for building the firmware candidates.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Copied stakeholder on QA standup communications and test plans.

## Related Concepts
- **Relay Radio Sleep Timer:** The core feature fix targeted by the MESH-118 retest plan.
- **Mesh Network Sizing:** Evaluating system performance and stability across varying node counts (3, 6, and 9 nodes).
- **Battery Regression Check:** The primary objective of the testing cycle to ensure updates do not negatively impact device longevity.

## Contradictions
*(No contradictions present in the provided sources.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

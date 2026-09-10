---
id: mesh-118
title: MESH-118
tags:
  - aurora-labs
  - battery-regression-check
  - jonah-park
  - lena-ito
  - mesh-118
  - mesh-network-sizing
  - mira-chen
  - relay-radio-sleep-timer
last_updated: "2026-09-10T14:39:09.126310+00:00"
sidebar_label: MESH-118
slug: /mesh-118
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MESH-118

## Overview

MESH-118 is a tracking ticket and [testing](./testing.md) initiative at [Aurora Labs](./aurora-labs.md) concerning the relay radio sleep timer. A draft test plan for validating the 0.3.9 candidate fix was distributed by Lena Ito in June 2026, ahead of a build by Jonah Park. The primary focus of MESH-118 is executing a battery regression check following introduction of the relay mode.

## Key Details

- **Target Build:** 0.3.9 candidate fix.
- **Scope of Testing:** 
  - Bench units: 6 units.
  - Mesh sizes: 3, 6, and 9 nodes (the 9-node [configuration](./configuration.md) intentionally exceeds the flash-before warning threshold to observe degradation behavior).
  - Duration: [Battery drain](./battery-drain.md) measured hourly for 48 hours per configuration.
- **Pass Criteria:** Battery drain must remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.
- **Out of Scope:** The 12-node stress configuration originating from the MESH-102 ticket, which belongs to a separate mesh-capacity workstream rather than this battery regression check.
- **Deliverables:** Drain-rate CSV and results posted by Lena Ito upon completion of the 48-hour testing window.

## Related Entities

- **Lena Ito:** QA team member who authored the MESH-118 retest plan and coordinated validation of the 0.3.9 candidate.
- **Jonah Park:** Engineering team member responsible for the build landing on Friday.
- **[Mira Chen](./aurora-nova-widget-v2.md):** CC'd stakeholder on the QA standup communications.
- **Aurora Labs:** Organization managing the engineering and QA workflows.

## Related Concepts

- **Relay Radio Sleep Timer:** The core feature/fix targeted by the MESH-118 ticket.
- **Battery Regression Check:** The functional testing stream designed to ensure [power consumption](./power-consumption.md) stays within acceptable tolerances compared to baseline builds (0.3.7).
- **Mesh Network Sizing:** Evaluation of network performance across varying node counts (3, 6, 9, and the out-of-scope 12-node stress config).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

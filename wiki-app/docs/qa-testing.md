---
id: qa-testing
title: QA Testing
tags:
  - aurora-labs
  - battery-drain-regression-check
  - jonah-park
  - lena-ito
  - qa-testing
  - relay-radio-sleep-timer
  - wiki
last_updated: "2026-09-02T06:42:00.404560+00:00"
sidebar_label: QA Testing
slug: /qa-testing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# QA Testing

## Overview
Quality Assurance (QA) testing at [Aurora Labs](./aurora-labs.md) encompasses structured validation plans for software candidates, regression checks, and performance benchmarks across various network configurations. A notable example includes the [MESH-118](./mesh-118.md) retest plan for the 0.3.9 candidate, focusing on relay radio sleep timer fixes and [battery drain](./battery-drain.md) regressions.

## Key Details
- **Test Plan Scope (MESH-118):** Validating the 0.3.9 candidate fix for the relay radio sleep timer (MESH-118).
- **Test Configurations:** 
  - Utilizes 6 bench units.
  - Tested across mesh sizes of 3, 6, and 9 nodes (with 9 nodes intentionally set over the flash-before warning threshold to observe degradation behavior).
- **Metrics & Duration:** Battery drain is measured hourly for 48 hours per configuration.
- **Pass Criteria:** Battery drain must remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.
- **Exclusions:** The 12-node stress config from the original MESH-102 ticket is excluded from this pass, as it belongs to a separate mesh-capacity workstream rather than a battery regression check.
- **Reporting:** Results and the accompanying drain-rate CSV are scheduled to be posted upon the completion of the 48-hour testing window.

## Related Entities
- **Lena Ito:** QA engineer/team member who drafted and communicated the MESH-118 retest plan.
- **Jonah Park:** Engineering team member responsible for building the software candidate.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Copied stakeholder on QA communications.
- **Aurora Labs:** Organization overseeing the engineering and QA workflows.

## Related Concepts
- **Battery Drain Regression Check:** Evaluating software builds to ensure [power consumption](./power-consumption.md) does not exceed established baselines.
- **Relay Radio Sleep Timer:** The specific feature fix targeted by the MESH-118 retest plan.
- **Mesh Network Sizing:** Benchmarking performance across different node counts (3, 6, 9, and 12 nodes) to understand capacity and degradation.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

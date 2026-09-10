---
id: quality-assurance
title: Quality Assurance
tags:
  - aurora-labs
  - battery-regression-check
  - jonah-park
  - lena-ito
  - mesh-network-sizing
  - mira-chen
  - quality-assurance
  - relay-radio-sleep-timer
last_updated: "2026-09-10T14:40:13.900507+00:00"
sidebar_label: Quality Assurance
slug: /quality-assurance
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Quality Assurance

## Overview
Quality Assurance (QA) at [Aurora Labs](./aurora-labs.md) encompasses the validation, [testing](./testing.md), and regression analysis of software candidates and [firmware](./firmware.md) fixes. A primary focus of current QA efforts involves verifying fixes for relay radio sleep timers and ensuring that system changes do not introduce regressions in [power consumption](./power-consumption.md) or stability across varying network configurations.

## Key Details
- **Test Plan Scope:** Validation of the 0.3.9 candidate fix for ticket [MESH-118](./mesh-118.md) (relay radio sleep timer).
- **Test Environment:** 6 bench units tested across mesh sizes of 3, 6, and 9 nodes. The 9-node [configuration](./configuration.md) intentionally exceeds the flash-before warning threshold to observe degradation behavior.
- **Duration & Metrics:** [Battery drain](./battery-drain.md) is measured hourly over a 48-hour window per configuration.
- **Pass Criteria:** Battery drain must remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.
- **Out of Scope:** The 12-node stress configuration originating from ticket MESH-102 is excluded from this pass, as it belongs to a separate mesh-capacity workstream rather than a battery regression check.
- **Deliverables:** Test results and the accompanying drain-rate CSV are scheduled for publication following the close of the 48-hour window.

## Related Entities
- **Lena Ito:** QA team member responsible for drafting and communicating the MESH-118 retest plan.
- **Jonah Park:** Engineering team member responsible for building and landing the candidate code.
- **[Mira Chen](./aurora-nova-widget-v2.md):** CC'd stakeholder on QA communications.
- **Aurora Labs:** Organization overseeing the engineering and quality assurance workflows.

## Related Concepts
- **Battery Regression Check:** Evaluation process to ensure [firmware updates](./firmware-updates.md) do not negatively impact device power longevity.
- **Relay Radio Sleep Timer:** Feature targeted by MESH-118, designed to optimize power states for relay nodes.
- **Mesh Network Sizing:** Scaling configurations (3, 6, 9, and 12 nodes) utilized to test network degradation limits and performance thresholds.

## Contradictions
*No contradictions currently identified in the QA records.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

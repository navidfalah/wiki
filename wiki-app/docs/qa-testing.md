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
last_updated: "2026-09-01T19:21:14.328169+00:00"
sidebar_label: QA Testing
slug: /qa-testing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# QA Testing

## Overview
Quality Assurance (QA) testing at [Aurora Labs](./aurora-labs.md) encompasses structured validation plans for [firmware releases](./firmware-releases.md), [hardware](./hardware.md) configurations, and [bug fixes](./bug-fixes.md). A prominent example includes the draft test plan detailed by Lena Ito for the 0.3.9 candidate addressing [MESH-118](./mesh-118.md) (relay radio sleep timer).

## Key Details
- **Focus of 0.3.9 Retest Plan (MESH-118):**
  - Scope utilizes 6 bench units across mesh sizes of 3, 6, and 9 nodes. The 9-node configuration intentionally exceeds the flash-before warning threshold to observe degradation behavior.
  - [Battery drain](./battery-drain.md) is measured hourly over a 48-hour period for each configuration.
  - **Pass Criteria:** Battery drain must remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.
- **Out of Scope:** The 12-node stress configuration originating from ticket MESH-102 is excluded from this pass, as it belongs to a separate mesh-capacity workstream rather than a battery regression check.
- **Reporting:** Results and the accompanying drain-rate CSV are scheduled for publication following the close of the 48-hour testing window.

## Related Entities
- **Lena Ito:** QA engineer responsible for drafting and communicating the MESH-118 retest plan.
- **Jonah Park:** Engineering team member providing the build for the 0.3.9 candidate.
- **[Mira Chen](./aurora-labs.md):** Copied stakeholder on QA standup communications.
- **Aurora Labs:** The organization conducting the testing.

## Related Concepts
- **Relay Radio Sleep Timer:** The feature fix targeted under ticket MESH-118.
- **Battery Drain Regression Check:** The primary evaluation metric ensuring [firmware updates](./firmware-updates.md) do not degrade device power efficiency.
- **Mesh Network Sizing:** Testing configurations utilizing 3, 6, and 9 nodes (with historical context involving 12-node stress tests).

## Contradictions
*(No contradictions present in the current source data.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

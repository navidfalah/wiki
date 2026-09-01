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
last_updated: "2026-09-01T21:25:20.041732+00:00"
sidebar_label: QA Testing
slug: /qa-testing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# QA Testing

## Overview
Quality Assurance (QA) testing at [Aurora Labs](./aurora-labs.md) involves systematic evaluation of [software releases](./software-releases.md) and [firmware](./firmware.md) fixes to ensure stability, performance, and regression prevention. A prominent example is the validation process for the 0.3.9 candidate release addressing [MESH-118](./mesh-118.md) (relay radio sleep timer), spearheaded by QA engineer Lena Ito.

## Key Details
- **Current Test Plan (MESH-118):** Focuses on validating the relay radio sleep timer fix for the 0.3.9 release candidate.
- **Test Environment & Scope:**
  - Utilizes 6 bench units across mesh sizes of 3, 6, and 9 nodes. 
  - The 9-node configuration intentionally exceeds the flash-before warning threshold to observe degradation behavior.
  - [Battery drain](./battery-drain.md) is measured hourly over a 48-hour window for each configuration.
- **Pass Criteria:** Battery drain must remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.
- **Exclusions:** The 12-node stress configuration from the original MESH-102 ticket is considered out of scope for this pass, categorized instead under a separate mesh-capacity workstream.
- **Reporting:** Results and the accompanying drain-rate CSV are scheduled to be posted upon completion of the 48-hour testing window.

## Related Entities
- **Lena Ito:** QA engineer leading the MESH-118 retest plan and drafting validation procedures.
- **Jonah Park:** Engineering team member responsible for building the upcoming candidate releases.
- **[Mira Chen](./nova-widget.md):** Copied stakeholder on QA communications.
- **Aurora Labs:** The organization conducting the engineering and QA workflows.

## Related Concepts
- **Battery Drain Regression Check:** A performance evaluation focused on ensuring updates do not negatively impact device battery longevity.
- **Relay Radio Sleep Timer:** The specific feature fix targeted under ticket MESH-118.
- **Mesh Network Topologies:** Testing configurations involving multiple nodes (3, 6, and 9 nodes) to monitor performance scaling and degradation.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

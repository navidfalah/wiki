---
id: release-039
title: Release 0.3.9
tags:
  - aurora-labs
  - battery-drain-regression-check
  - jonah-park
  - lena-ito
  - relay-radio-sleep-timer
  - release-039
  - wiki
last_updated: "2026-09-02T06:42:02.203330+00:00"
sidebar_label: Release 0.3.9
slug: /release-039
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Release 0.3.9

## Overview
Release 0.3.9 is a software candidate focused primarily on validating a fix for [MESH-118](./mesh-118.md) (relay radio sleep timer). [QA testing](./qa-testing.md) for this release candidate involves measuring [battery drain](./battery-drain.md) and verifying stability across varying mesh configurations, managed by [Aurora Labs](./aurora-labs.md) engineering and QA teams.

## Key Details
- **Focus:** Validating the MESH-118 fix for the relay radio sleep timer.
- **Build Management:** Built by Jonah Park.
- **QA Test Plan:** Formulated by Lena Ito for the 0.3.9 candidate.
- **Test Scope:**
  - 6 bench units tested across mesh sizes of 3, 6, and 9 nodes (with 9 nodes intentionally exceeding the flash-before warning threshold to observe degradation behavior).
  - Battery drain measured hourly for a 48-hour period per configuration.
  - Pass criteria: Battery drain must remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.
- **Exclusions:** The 12-node stress config from the original MESH-102 ticket is out of scope for this pass, categorized instead under a separate mesh-capacity workstream.
- **Deliverables:** Test results and an attached drain-rate CSV to be posted upon the completion of the 48-hour window.

## Related Entities
- **Aurora Labs:** The organization developing and testing the release.
- **Lena Ito:** QA team member responsible for drafting the MESH-118 retest plan.
- **Jonah Park:** Engineering team member responsible for the build landing.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Copied on communications regarding the QA [standup notes](./standup-notes.md).

## Related Concepts
- **Relay Radio Sleep Timer:** The core feature/fix targeted by MESH-118 in this release.
- **Battery Drain Regression Check:** The primary evaluation metric used to benchmark the 0.3.9 release against the 0.3.7 baseline.
- **Mesh Sizes:** Configurations of 3, 6, and 9 nodes used during bench testing.

## Contradictions
*No contradictions have been identified in the current sources for Release 0.3.9.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

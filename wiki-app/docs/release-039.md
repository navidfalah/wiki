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
last_updated: "2026-09-01T19:21:16.297933+00:00"
sidebar_label: Release 0.3.9
slug: /release-039
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Release 0.3.9

## Overview
Release 0.3.9 is an upcoming software release from [Aurora Labs](./aurora-labs.md) focused primarily on validating a fix for [MESH-118](./mesh-118.md) (relay radio sleep timer). A draft test plan for this release candidate was circulated by QA in early June 2026 to prepare for Jonah Park's build.

## Key Details
- **Focus:** Validating the fix for MESH-118 regarding the relay radio sleep timer.
- **Testing Scope:**
  - Utilizes 6 bench units across mesh sizes of 3, 6, and 9 nodes. (The 9-node configuration intentionally exceeds the flash-before warning threshold to observe degradation behavior).
  - [Battery drain](./battery-drain.md) is measured hourly over a 48-hour period for each configuration.
  - **Pass Bar:** Battery drain must remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.
- **Out of Scope:** The 12-node stress configuration originating from MESH-102 is excluded from this pass, as it belongs to a separate mesh-capacity workstream rather than serving as a battery regression check.
- **Timeline:** Results and the drain-rate CSV are scheduled to be posted following the close of the 48-hour window.

## Related Entities
- **Aurora Labs:** The organization developing the software and managing the release.
- **Lena Ito:** QA team member who authored the test plan and coordination emails.
- **Jonah Park:** Engineering team member responsible for the build landing in the release cycle.
- **[Mira Chen](./aurora-labs.md):** Copied stakeholder on release and QA correspondence.

## Related Concepts
- **MESH-118:** The core ticket addressing the relay radio sleep timer fix targeted in Release 0.3.9.
- **MESH-102:** A separate mesh-capacity workstream ticket involving a 12-node stress configuration, explicitly out of scope for this release.
- **Battery Drain Regression Check:** The primary validation metric ensuring that relay mode updates do not severely impact device [battery life](./battery-life.md) compared to the 0.3.7 baseline.
- **Relay Radio Sleep Timer:** The specific [firmware](./firmware.md)/software component being fixed and retested.

## Contradictions
*(No contradictions present in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

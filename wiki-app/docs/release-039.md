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
last_updated: "2026-09-01T21:25:21.937756+00:00"
sidebar_label: Release 0.3.9
slug: /release-039
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Release 0.3.9

## Overview
Release 0.3.9 is an upcoming software version for [Aurora Labs](./aurora-labs.md), primarily focused on validating a fix for [MESH-118](./mesh-118.md) (relay radio sleep timer). A draft test plan for this release candidate was circulated by QA in early June 2026 ahead of the build managed by Jonah Park.

## Key Details
- **Focus:** Validating the MESH-118 fix concerning the relay radio sleep timer.
- **Testing Scope:**
  - Utilizes 6 bench units across mesh sizes of 3, 6, and 9 nodes.
  - The 9-node configuration intentionally exceeds the flash-before warning threshold to observe degradation behavior.
  - [Battery Drain](./battery-drain.md) is measured hourly over a 48-hour window for each configuration.
- **Pass Criteria:** Battery drain must remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.
- **Out of Scope:** The 12-node stress configuration from the original MESH-102 ticket, which is designated for a separate mesh-capacity workstream rather than this battery regression check.

## Related Entities
- **Aurora Labs:** The organization developing the software and managing the release.
- **Lena Ito:** QA team member who authored and distributed the MESH-118 retest plan for the 0.3.9 candidate.
- **Jonah Park:** Engineering team member responsible for building the release candidate.
- **[Mira Chen](./nova-widget.md):** Copied on the QA [Standup Notes](./standup-notes.md) email.

## Related Concepts
- **Battery Drain Regression Check:** The primary testing objective for release 0.3.9 to ensure [Power Consumption](./power-consumption.md) stays within acceptable parameters.
- **Relay Radio Sleep Timer:** The specific feature fix being tested under MESH-118.
- **Mesh Sizes / Configurations:** Bench testing topologies involving 3, 6, and 9 nodes.

## Contradictions
*(No contradictions present in the current source data.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

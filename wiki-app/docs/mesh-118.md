---
id: mesh-118
title: MESH-118
tags:
  - aurora-labs
  - battery-drain-regression-check
  - jonah-park
  - lena-ito
  - mesh-118
  - relay-radio-sleep-timer
  - wiki
last_updated: "2026-09-01T21:24:02.185721+00:00"
sidebar_label: MESH-118
slug: /mesh-118
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MESH-118

## Overview

MESH-118 is an internal engineering task and tracking identifier at [Aurora Labs](./aurora-labs.md) focused on the relay radio sleep timer and a [battery drain](./battery-drain.md) regression check for the [Release 0.3.9](./release-039.md) release candidate. The draft test plan for validating the fix was coordinated by Lena Ito ahead of Jonah's build.

## Key Details

- **Scope of Testing:** 
  - Conducted across 6 bench units.
  - Tested with [mesh networking](./mesh-networking.md) sizes of 3, 6, and 9 nodes (with 9 nodes intentionally set over the flash-before warning threshold to observe degradation behavior).
  - [Battery drain](./battery-drain.md) is measured hourly over a 48-hour period for each configuration.
- **Pass Bar:** The [battery drain](./battery-drain.md) must be within 10% of the 0.3.7 baseline (established pre-relay-mode) at 6 nodes or fewer.
- **Exclusions:** The 12-node stress configuration from the original MESH-102 ticket is explicitly out of scope for this pass, as it belongs to a separate mesh-capacity workstream rather than the battery regression check.
- **Timeline:** Results and the attached drain-rate CSV were scheduled to be posted upon the close of the 48-hour test window.

## Related Entities

- **Aurora Labs:** The organization conducting the engineering work and [QA testing](./qa-testing.md).
- **Lena Ito:** QA team member (`lena.ito@auroralabs.example`) who drafted and distributed the MESH-118 retest plan.
- **Jonah Park:** Engineering team member responsible for landing the build (`jonah.park@auroralabs.example`).
- **[Mira Chen](./nova-widget.md):** Copied stakeholder on the QA [standup notes](./standup-notes.md) (`mira.chen@auroralabs.example`).

## Related Concepts

- **Relay Radio Sleep Timer:** The specific feature component being fixed and retested under MESH-118.
- **Battery Drain Regression Check:** The primary validation goal to ensure recent updates do not negatively impact device battery longevity compared to the 0.3.7 baseline.
- **Mesh-Capacity Workstream:** A separate tracking effort encompassing larger stress configurations, such as the 12-node setup from MESH-102.

## Contradictions

*No contradictions have been identified in the current source [documentation](./documentation.md) for MESH-118.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

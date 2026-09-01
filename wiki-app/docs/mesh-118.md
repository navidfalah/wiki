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
last_updated: "2026-09-01T19:19:53.079364+00:00"
sidebar_label: MESH-118
slug: /mesh-118
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MESH-118

## Overview

MESH-118 is an internal engineering ticket and work item at [Aurora Labs](./aurora-labs.md) concerning the relay radio sleep timer and its associated [Battery Drain](./battery-drain.md) regression check for the [Release 0.3.9](./release-039.md) release candidate. The draft test plan for validating the fix was outlined by Lena Ito in June 2026 ahead of Jonah Park's build.

## Key Details

- **Scope:** The test plan evaluates 6 bench units across [Mesh Networking](./mesh-networking.md) sizes of 3, 6, and 9 nodes. The 9-node configuration intentionally exceeds the flash-before warning threshold to observe how the system degrades under stress.
- **Testing Methodology:** Battery drain is measured hourly for 48 hours per configuration.
- **Pass Criteria:** The pass bar requires battery drain to remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.
- **Out of Scope:** The 12-node stress configuration originating from the MESH-102 ticket is excluded from this pass, as it belongs to a separate mesh-capacity workstream rather than the battery regression check.
- **Deliverables:** Test results and the drain-rate CSV are scheduled to be posted upon the closing of the 48-hour testing window.

## Related Entities

- **Aurora Labs:** The organization conducting the engineering work and [QA Testing](./qa-testing.md).
- **Lena Ito:** QA team member who authored the MESH-118 retest plan and coordinates testing updates.
- **Jonah Park:** Engineering team member responsible for building the software candidate.
- **[Mira Chen](./aurora-labs.md):** CC'd recipient on the QA standup and retest plan communications.

## Related Concepts

- **Relay Radio Sleep Timer:** The core feature/fix targeted by the MESH-118 ticket.
- **Battery Drain Regression:** The primary metric being monitored and compared against the 0.3.7 baseline.
- **Mesh Capacity:** A separate workstream associated with the 12-node stress configurations from MESH-102.

## Contradictions

*No contradictions reported in the current [Documentation](./documentation.md).*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

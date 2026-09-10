---
id: qa-and-testing
title: QA and Testing
tags:
  - aurora-labs
  - jonah-park
  - lena-ito
  - mesh-118
  - mesh-capacity-workstream
  - mira-chen
  - qa-and-testing
  - wiki
last_updated: "2026-09-10T14:40:11.996059+00:00"
sidebar_label: QA and Testing
slug: /qa-and-testing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# QA and Testing

## Overview
QA and [Testing](./testing.md) processes at [Aurora Labs](./aurora-labs.md) cover the validation and verification of [software releases](./software-releases.md), [bug fixes](./bug-fixes.md), and feature modifications. A primary example is the retest planning for the 0.3.9 candidate addressing [MESH-118](./mesh-118.md) (relay radio sleep timer), managed by Lena Ito.

## Key Details
- **Scope of 0.3.9 Retest Plan (MESH-118):**
  - Utilizes 6 bench units with mesh sizes of 3, 6, and 9 nodes.
  - The 9-node [configuration](./configuration.md) intentionally exceeds the flash-before warning threshold to observe system degradation behavior.
  - [Battery drain](./battery-drain.md) is measured hourly for 48 hours across each configuration.
- **Pass Criteria:**
  - Drain must remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.
- **Out of Scope:**
  - The 12-node stress configuration from the original MESH-102 ticket, which belongs to a separate mesh-capacity workstream rather than serving as a battery regression check.
- **Deliverables:**
  - Test results and the accompanying drain-rate CSV are scheduled for publication following the close of the 48-hour testing window.

## Related Entities
- **Lena Ito:** QA engineer leading the 0.3.9 retest plan and drafting test procedures.
- **Jonah Park:** Engineering team member responsible for building the candidate release.
- **[Mira Chen](./aurora-nova-widget-v2.md):** CC'd stakeholder on QA communications.
- **Aurora Labs:** Organization housing the engineering and QA teams.

## Related Concepts
- **MESH-118:** Ticket tracking the relay radio sleep timer fix.
- **MESH-102:** Original ticket associated with the 12-node stress configuration.
- **Mesh-Capacity Workstream:** Separate initiative handling high-node stress testing and capacity limits.
- **Battery Regression Check:** Focused evaluation of [power consumption](./power-consumption.md) against baseline releases (such as 0.3.7).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/ideas/emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

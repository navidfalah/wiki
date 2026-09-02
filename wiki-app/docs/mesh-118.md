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
last_updated: "2026-09-02T06:40:42.177296+00:00"
sidebar_label: MESH-118
slug: /mesh-118
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# MESH-118

## Overview
MESH-118 is a tracking ticket at [Aurora Labs](./aurora-labs.md) concerning the relay radio sleep timer and an associated [battery drain](./battery-drain.md) regression. A draft test plan was proposed to validate the [Release 0.3.9](./release-039.md) candidate fix prior to its integration build.

## Key Details
- **Scope of Testing:** 6 bench units tested across mesh sizes of 3, 6, and 9 nodes. The 9-node configuration intentionally exceeds the flash-before warning threshold to observe degradation behavior.
- **Duration & Metrics:** Battery drain is measured hourly for 48 hours per configuration.
- **Pass Criteria:** Drain must remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.
- **Out of Scope:** The 12-node stress configuration originating from the MESH-102 ticket is excluded from this pass, as it belongs to a separate mesh-capacity workstream rather than being a battery regression check.
- **Deliverables:** Results and the drain-rate CSV attachment are scheduled to be posted upon the completion of the 48-hour window.

## Related Entities
- **Aurora Labs:** The organization managing the engineering team and testing workflows.
- **Lena Ito:** QA team member (`lena.ito@auroralabs.example`) who authored the retest plan and email notification.
- **Jonah Park:** Engineering team member responsible for the build containing the fix.
- **[Mira Chen](./aurora-nova-widget-v2.md):** Copied stakeholder on the QA communications.

## Related Concepts
- **Relay Radio Sleep Timer:** The feature and ticket focus under evaluation for [battery management](./battery-management.md).
- **Battery Drain Regression Check:** The primary testing objective to ensure [firmware updates](./firmware-updates.md) do not abnormally consume device power.
- **Mesh Capacity Workstream:** A separate initiative handling heavier node stress configurations (such as the 12-node stress config from MESH-102).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

---
id: bug-triage
title: Bug Triage
tags:
  - aurora-labs-support
  - bug-triage
  - jonah-park
  - kevin-ostrander
  - mesh-118
  - nova-59
  - nova-widget
  - sam-okafor
last_updated: "2026-09-10T14:37:34.074086+00:00"
sidebar_label: Bug Triage
slug: /bug-triage
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bug Triage

## Overview
Bug triage processes involve analyzing, categorizing, and tracking issues reported by users during [beta-testing](./beta-testing.md) phases. A prominent example is tracked under issue **[NOVA](./aurora-nova-widget-v2.md)-59**, which investigates why the [Nova Widget](./nova-widget.md) fails to reconnect to Wi-Fi following an unclean power loss while running [firmware](./firmware.md) version 0.3.8. [Aurora Labs Support](./aurora-nova-widget-v2.md) is actively investigating this behavior with input from both product and firmware teams.

## Key Details
- **Issue Identifier:** NOVA-59
- **Affected Product:** Nova Widget (Batch 4 beta)
- **Symptom:** Wi-Fi credentials and state do not survive an unclean power loss on version 0.3.8, leading to lost history.
- **[Troubleshooting](./troubleshooting.md) & Mitigation Steps:**
  - Requesting router logs from users, specifically DHCP lease renewal timestamps around the time of the outage.
  - Setting a static DHCP reservation for the widget's MAC address in the router to mitigate issues related to changed IP addresses after reconnection.
  - Performing a soft Wi-Fi-only reset (holding the side button for 3 seconds) instead of a full factory reset, which preserves sensor history.

## Related Entities
- **Kevin Ostrander:** Beta user reporting the Nova Widget Wi-Fi reconnection issue.
- **Sam Okafor:** Aurora Labs team member involved in [customer support](./customer-support.md) and bug escalation.
- **Jonah Park:** Firmware team member looped into the issue due to potential underlying state-corruption similarities.
- **Aurora Labs Support:** Support team handling triage and communication with beta testers (`support@auroralabs.example`).

## Related Concepts
- **State-Corruption Bugs:** Potential systemic issues where device state (such as Wi-Fi supplicant state or relay radio configurations) becomes corrupted during unexpected power losses, drawing parallels to previous issues like **[MESH-118](./mesh-118.md)**.
- **Beta Testing Feedback:** Real-world usage data and user reports from batch releases utilized to refine firmware and identify subsystem vulnerabilities.

## Contradictions
*(No contradictions identified in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |

---
id: firmware-bugs
title: Firmware Bugs
tags:
  - aurora-labs
  - firmware-bugs
  - jonah-park
  - kevin-ostrander
  - mesh-118
  - nova-59
  - nova-widget
  - sam-okafor
last_updated: "2026-09-10T14:38:06.716737+00:00"
sidebar_label: Firmware Bugs
slug: /firmware-bugs
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Bugs

## Overview
[Firmware](./firmware.md) bugs represent critical software-level issues affecting device stability, state persistence, and connectivity in [hardware](./hardware.md) products like the [Aurora Nova Widget v2](./aurora-nova-widget-v2.md) Widget. [Bug Triage](./bug-triage.md) tracking, such as issue NOVA-59, helps identify root causes like state corruption during unclean power losses and links related subsystem failures across different device models and communication [protocols](./protocols.md).

## Key Details
- **NOVA-59**: A tracked issue on firmware version 0.3.8 where Wi-Fi credentials and connection state fail to survive an unclean power loss, resulting in lost device history.
- **Workarounds for NOVA-59**:
  - Setting a static DHCP reservation for the widget's MAC address in the router to prevent connection issues caused by changed IP addresses after reconnect.
  - Using a soft Wi-Fi-only reset (holding the side button for 3 seconds) instead of a full factory reset to preserve sensor history.
- **[Troubleshooting](./troubleshooting.md) Requirements**: Router logs—specifically DHCP lease renewal timestamps around the time of the outage—are requested to diagnose Wi-Fi reconnection failures.

## Related Entities
- **[Aurora Labs Nova Widget v2](./aurora-nova-widget-v2.md)**: The support team handling customer reports and logging beta feedback.
- **Kevin Ostrander**: Beta user who reported the Wi-Fi reconnection issue following a power outage.
- **Sam Okafor**: [Aurora Labs](./aurora-labs.md) team member who looped in [Firmware Development](./firmware-development.md).
- **Jonah Park**: Firmware engineer investigating state-corruption bug classes.
- **[Nova Widget](./nova-widget.md)**: The hardware device experiencing firmware behavior issues during the batch 4 [Hardware Beta](./hardware-beta.md).

## Related Concepts
- **State Corruption**: A class of software bugs where device states (such as Wi-Fi supplicant state or relay radio configurations) become corrupted or fail to persist through power interruptions.
- **[MESH-118](./mesh-118.md)**: A related state-corruption bug class affecting relay radios, sharing similarities with the Wi-Fi subsystem bug identified in NOVA-59.
- **Firmware Triage**: The process of logging, categorizing, and routing beta feedback to appropriate engineering resources.

## Contradictions
*(None identified in current sources)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/ideas/emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |

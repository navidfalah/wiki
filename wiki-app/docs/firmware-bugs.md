---
id: firmware-bugs
title: Firmware Bugs
tags:
  - aurora-labs
  - aurora-labs-support
  - data-loss-on-factory-reset
  - firmware-bugs
  - jonah-park
  - kevin-ostrander
  - mesh-118
  - nova-59
last_updated: "2026-09-01T19:18:36.438917+00:00"
sidebar_label: Firmware Bugs
slug: /firmware-bugs
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Bugs

## Overview
[Firmware](./firmware.md) bugs in [Aurora Labs](./aurora-labs.md) devices involve state-corruption and reconnection issues, notably affecting the [Nova Widget](./nova-widget.md) on firmware version 0.3.8. An example includes devices failing to rejoin home [Wi-Fi Connectivity](./wi-fi-connectivity.md) networks following unexpected power losses or router updates, resulting in persistent blinking blue indicator states.

## Key Details
- **Nova Widget Issue (NOVA-59):** Wi-Fi credentials and connection state fail to survive an unclean power loss or router [Firmware Updates](./firmware-updates.md) on firmware version 0.3.8.
- **Data Loss:** Users experiencing the issue have reported losing weeks of sensor history when forced to factory reset and re-pair devices from scratch.
- **Workarounds:** 
  - Setting a static DHCP reservation for the widget's MAC address can mitigate reconnection issues caused by changed IP addresses.
  - Performing a soft Wi-Fi-only reset (holding the side button for 3 seconds) instead of a full factory reset allows users to clear connection states without wiping local sensor history.
- **[Debugging](./debugging.md):** Support has requested router logs—specifically DHCP lease renewal timestamps surrounding outages—to further diagnose the bug.

## Related Entities
- **Kevin Ostrander:** Beta tester (batch 4) who reported the Nova Widget Wi-Fi reconnection bug.
- **[Aurora Labs Support](./aurora-labs.md) / Sam Okafor:** Support team handling customer [Troubleshooting](./troubleshooting.md) and internal triage.
- **Jonah Park:** Firmware engineer looped in to investigate the state-corruption bug class.

## Related Concepts
- **NOVA-59:** The tracking ID for the Nova Widget Wi-Fi credential and state persistence bug.
- **[MESH-118](./mesh-118.md):** A related bug class dealing with state-corruption in the relay radio subsystem, sharing structural similarities with the Wi-Fi supplicant state issue.
- **State Corruption:** A recurring theme in firmware behavior where device settings or [Networking](./networking.md) configurations fail to persist securely across reboots or power outages.

## Contradictions
*(No direct contradictions found in the current sources.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-11-nova-59-customer-wifi-complaint.eml` | email | Medium |
| 2 | `emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |

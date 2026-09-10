---
id: firmware-development
title: Firmware Development
tags:
  - aurora-labs-support
  - firmware-development
  - jonah-park
  - kevin-ostrander
  - mesh-118
  - nova-59
  - nova-widget
  - sam-okafor
last_updated: "2026-09-10T14:38:08.610692+00:00"
sidebar_label: Firmware Development
slug: /firmware-development
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Development

## Overview
[Firmware](./firmware.md) development for [Aurora Labs](./aurora-labs.md) devices involves handling device state, connection persistence, and subsystem reliability during unexpected events such as unclean power losses. Issues reported during [beta testing](./beta-testing.md)—such as Wi-Fi credentials or state failing to survive a power outage on firmware version 0.3.8 (logged as [NOVA](./aurora-nova-widget-v2.md)-59)—help engineering teams identify state-corruption classes of bugs across different subsystems.

## Key Details
- **Logged Issue (NOVA-59):** Wi-Fi credentials and state fail to survive an unclean power loss on firmware version 0.3.8 on the [Nova Widget](./nova-widget.md).
- **Workarounds and [Troubleshooting](./troubleshooting.md):**
  - Setting a static DHCP reservation for the widget's MAC address in the router helps prevent issues related to changed IP addresses after reconnects.
  - Avoiding full factory resets during a dropped connection; holding the side button for 3 seconds performs a soft Wi-Fi-only reset that preserves sensor history.
  - Providing router logs, particularly DHCP lease renewal timestamps around the outage, aids in triage.
- **Related Subsystems:** Investigation includes analyzing Wi-Fi supplicant state compared to relay radio behavior.

## Related Entities
- **[Aurora Labs Support](./aurora-nova-widget-v2.md)** (`support@auroralabs.example`)
- **Kevin Ostrander** (`kevin.ostrander@gmail.example`) - Beta tester / user reporting issues
- **Sam Okafor** (`sam.okafor@auroralabs.example`) - Aurora Labs team member handling support/triage
- **Jonah Park** (`jonah-park@auroralabs.example`) - Aurora Labs firmware engineer

## Related Concepts
- **NOVA-59:** Tracking ticket for the Wi-Fi credentials/state persistence bug on firmware 0.3.8.
- **[MESH-118](./mesh-118.md):** A prior or related state-corruption class bug affecting the relay radio subsystem.
- **Batch 4 Beta:** The current testing phase providing valuable user feedback for firmware refinement.

## Contradictions
*(No contradictions present in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |

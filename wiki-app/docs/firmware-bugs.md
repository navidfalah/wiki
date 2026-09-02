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
last_updated: "2026-09-02T06:39:24.135749+00:00"
sidebar_label: Firmware Bugs
slug: /firmware-bugs
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Bugs

## Overview
[Firmware](./firmware.md) bugs in [Aurora Labs](./aurora-labs.md) devices involve state-corruption issues triggered by unexpected events, such as power outages or router updates. A prominent issue affecting the [Nova Widget](./nova-widget.md) (firmware version 0.3.8) highlights problems with Wi-Fi credential and state persistence during unclean power losses, leading to connection failures and potential data loss if improper [troubleshooting](./troubleshooting.md) steps are taken.

## Key Details
- **Nova Widget Issue (NOVA-59):** Beta testers reported that the Nova Widget fails to reconnect to [Wi-Fi Connectivity](./wi-fi-connectivity.md) after a power outage, getting stuck blinking blue. A similar issue previously occurred following a router firmware update in May.
- **Data Loss Risk:** Full factory resets required to restore connection wipe accumulated sensor history (e.g., three weeks of data). However, a soft Wi-Fi-only reset (holding the side button for 3 seconds) can preserve sensor history.
- **Workarounds:** Setting a static DHCP reservation for the widget's MAC address can mitigate issues caused by changed IP addresses upon reconnection.
- **[Debugging](./debugging.md) Requirements:** Router logs, specifically DHCP lease renewal timestamps around the time of the outage, are requested for troubleshooting.

## Related Entities
- **Kevin Ostrander:** Beta tester (batch 4) who reported the Nova Widget Wi-Fi bug.
- **[Aurora Labs Support](./aurora-nova-widget-v2.md) / Sam Okafor / Jonah Park:** Support and engineering personnel investigating and triaging the bug.
- **Nova Widget:** The device model affected by bug NOVA-59.

## Related Concepts
- **NOVA-59:** The tracking ID for the Wi-Fi credentials/state persistence bug on firmware version 0.3.8.
- **[MESH-118](./mesh-118.md):** A related state-corruption bug class affecting relay radios, sharing similarities with the Wi-Fi supplicant state issue.
- **State Corruption:** A recurring firmware vulnerability category involving how device configurations and connection states are saved and recovered.

## Contradictions
*(No contradictions identified in the provided sources.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-11-nova-59-customer-wifi-complaint.eml` | email | Medium |
| 2 | `emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |

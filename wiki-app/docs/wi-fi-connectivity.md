---
id: wi-fi-connectivity
title: Wi-Fi Connectivity
tags:
  - aurora-labs
  - aurora-labs-support
  - data-loss-on-factory-reset
  - jonah-park
  - kevin-ostrander
  - mesh-118
  - nova-59
  - nova-widget
last_updated: "2026-09-01T21:26:04.122162+00:00"
sidebar_label: Wi-Fi Connectivity
slug: /wi-fi-connectivity
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wi-Fi Connectivity

## Overview
Wi-Fi connectivity issues on the [Nova Widget](./nova-widget.md) (Batch 4 beta devices running [firmware](./firmware.md) version 0.3.8) can occur following power outages or router updates. Specifically, devices may fail to automatically rejoin home networks, becoming stuck in a blinking blue state. 

## Key Details
- **Symptom:** Nova Widget fails to reconnect to Wi-Fi after an unexpected power loss or router firmware update, remaining stuck with a blinking blue indicator light.
- **Data Loss Risk:** Performing a full factory reset to resolve the connection failure erases stored device data (such as weeks of accumulated sensor history).
- **Workarounds & Mitigation:**
  - **Soft Reset:** Instead of a full factory reset, holding the device's side button for 3 seconds performs a soft Wi-Fi-only reset that preserves sensor history.
  - **Static DHCP:** Setting a static DHCP reservation for the widget's MAC address on the home router can reduce occurrences, as some reports correlate issues with changing IP addresses upon reconnection.
- **[Troubleshooting](./troubleshooting.md):** [Aurora Labs Support](./nova-widget.md) recommends providing router logs—specifically DHCP lease renewal timestamps around the time of the outage—to aid in [debugging](./debugging.md).

## Related Entities
- **Kevin Ostrander:** Beta tester (Batch 4) who reported the Wi-Fi reconnection issue.
- **Aurora Labs Support:** Support team handling the investigation (including Sam Okafor and Jonah Park).
- **Nova Widget (NOVA-59):** The [hardware](./hardware.md) product experiencing the state-corruption bug.

## Related Concepts
- **NOVA-59:** The tracking designation for the bug where Wi-Fi credentials and state do not survive an unclean power loss on firmware 0.3.8.
- **[MESH-118](./mesh-118.md):** A related bug class involving state-corruption on a different subsystem (relay radio), indicating a broader architectural pattern being investigated by the firmware team led by Jonah Park.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-11-nova-59-customer-wifi-complaint.eml` | email | Medium |
| 2 | `emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |

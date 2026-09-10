---
id: wi-fi-troubleshooting
title: Wi-Fi Troubleshooting
tags:
  - aurora-labs-support
  - jonah-park
  - kevin-ostrander
  - mesh-118
  - nova-59
  - nova-widget
  - sam-okafor
  - soft-wi-fi-reset
last_updated: "2026-09-10T14:41:07.053711+00:00"
sidebar_label: Wi-Fi Troubleshooting
slug: /wi-fi-troubleshooting
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wi-Fi Troubleshooting

## Overview
This wiki page covers [troubleshooting](./troubleshooting.md) procedures and known issues related to [Wi-Fi connectivity](./wi-fi-connectivity.md) problems on [Aurora Labs](./aurora-labs.md) devices, specifically addressing behavior following power outages and unexpected disconnections.

## Key Details
- **[NOVA](./aurora-nova-widget-v2.md)-59 Issue:** Identified on [firmware](./firmware.md) version 0.3.8, where Wi-Fi credentials and state fail to survive an unclean power loss (logged under tracking issue NOVA-59).
- **Recommended Recovery Steps:**
  - Avoid performing a full factory reset if the device fails to reconnect after a power outage.
  - Instead, try holding the device's side button for 3 seconds to initiate a **soft Wi-Fi-only reset**, which preserves sensor history.
- **Preventative Measures:**
  - Set a static DHCP reservation for the widget's MAC address in your router to prevent dropped connections caused by IP address changes upon reconnect.
- **Diagnostics:** Router logs, particularly DHCP lease renewal timestamps surrounding the time of the outage, are useful for investigating reconnection failures.

## Related Entities
- **Kevin Ostrander:** Beta user reporting the [Nova Widget](./nova-widget.md) reconnection issue.
- **[Aurora Labs Support](./aurora-nova-widget-v2.md):** Support team handling user feedback and issue triage.
- **Sam Okafor:** Support/engineering team member looping in firmware specialists.
- **Jonah Park:** Firmware engineer investigating the state-corruption bug class.

## Related Concepts
- **NOVA-59:** Tracking identifier for the bug where Wi-Fi credentials do not survive unclean power loss.
- **[MESH-118](./mesh-118.md):** A related firmware state-corruption bug class affecting the relay radio, sharing similarities with the Wi-Fi supplicant state issue.
- **Soft Wi-Fi Reset:** A 3-button hold procedure designed to reset network settings while keeping user and sensor history intact.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |

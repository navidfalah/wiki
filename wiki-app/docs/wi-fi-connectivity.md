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
last_updated: "2026-09-01T19:21:57.860540+00:00"
sidebar_label: Wi-Fi Connectivity
slug: /wi-fi-connectivity
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wi-Fi Connectivity

## Overview
Wi-Fi connectivity issues on the [Nova Widget](./nova-widget.md) have been identified, particularly concerning how the device handles connection restoration after unexpected power losses or network disruptions. [Beta Testing](./beta-testing.md) feedback from users has highlighted vulnerabilities in how Wi-Fi credentials and connection states are preserved on [firmware](./firmware.md) version 0.3.8.

## Key Details
- **The Issue (NOVA-59):** Wi-Fi credentials and connection states fail to survive unclean power losses on firmware version 0.3.8, leaving the device stuck blinking blue and unable to rejoin the network automatically.
- **Precedent:** Similar connection failures have been triggered by events such as router [firmware updates](./firmware-updates.md).
- **Data Loss Risk:** Performing a full factory reset to resolve connection drops erases accumulated local data, such as weeks of sensor history.
- **Workarounds and Mitigations:**
  - **Soft Reset:** Instead of a full factory reset, users can hold the side button for 3 seconds to execute a soft Wi-Fi-only reset, which preserves sensor history.
  - **Static DHCP Reservation:** Assigning a static DHCP reservation for the widget's MAC address in the router settings can mitigate reconnect issues, as some reports correlate failures with changed IP addresses after a reconnect attempt.
- **[Debugging](./debugging.md):** Support has requested router logs—specifically DHCP lease renewal timestamps around outage events—to aid in diagnosing the root cause.

## Related Entities
- **Nova Widget:** The [hardware](./hardware.md) device experiencing the Wi-Fi reconnection issues.
- **Kevin Ostrander:** Beta tester (batch 4) who reported the connectivity failure and data loss.
- **[Aurora Labs](./aurora-labs.md) Support:** Support team handling the bug triage.
- **Sam Okafor:** Support team member involved in tracking the issue.
- **Jonah Park:** Firmware engineer looped in to investigate the bug.

## Related Concepts
- **NOVA-59:** The specific issue tracking Wi-Fi credentials and state failure during unclean power loss on firmware 0.3.8.
- **[MESH-118](./mesh-118.md):** A related state-corruption class bug involving relay radio subsystems, suggesting a broader pattern of state-handling issues across firmware features.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-11-nova-59-customer-wifi-complaint.eml` | email | Medium |
| 2 | `emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |

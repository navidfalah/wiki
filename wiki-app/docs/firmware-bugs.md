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
last_updated: "2026-09-01T21:22:45.148230+00:00"
sidebar_label: Firmware Bugs
slug: /firmware-bugs
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Bugs

## Overview
[Firmware](./firmware.md) bugs in [IoT](./iot.md) deployment can lead to unexpected device behavior, such as connection failures following power outages or router updates. A prominent example is tracked under **[NOVA](./nova-widget.md)-59**, affecting the [Nova Widget](./nova-widget.md) on firmware version `0.3.8`. These issues often stem from state-corruption vulnerabilities where device credentials or states fail to survive unclean power losses.

## Key Details
- **Affected Device/Version:** Nova Widget (Batch 4 beta tester unit), running firmware version `0.3.8`.
- **Primary Symptom:** Devices get stuck blinking blue and refuse to rejoin the home Wi-Fi after a power outage or router firmware update.
- **Data Loss Risk:** Full factory resets required to resolve reconnection failures currently wipe accumulated local sensor history (e.g., 3 weeks of data).
- **Mitigation & Workarounds:**
  - Setting a static DHCP reservation on the router can prevent issues related to IP changes upon reconnection.
  - Using a soft Wi-Fi-only reset (holding the side button for 3 seconds) instead of a full factory reset preserves local sensor history.
- **[Debugging](./debugging.md) Requirements:** Support teams request router logs, specifically DHCP lease renewal timestamps around the time of the outage.

## Related Entities
- **Kevin Ostrander:** Beta tester (batch 4) who reported the Nova Widget Wi-Fi reconnection bug.
- **[Aurora Labs Support](./nova-widget.md) / Sam Okafor:** Support team handling triage and customer communication.
- **Jonah Park:** Firmware engineer looped in to investigate potential state-corruption classes of bugs.

## Related Concepts
- **State-Corruption Bugs:** Vulnerabilities where volatile or non-volatile state data becomes corrupted or unrecoverable during power interruptions.
- **Wi-Fi Supplicant State:** The subsystem responsible for managing Wi-Fi credentials and connection handshakes, suspected in NOVA-59.

## Contradictions
*No contradictions were identified in the provided sources.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-11-nova-59-customer-wifi-complaint.eml` | email | Medium |
| 2 | `emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |

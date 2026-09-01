---
id: customer-support
title: Customer Support
tags:
  - alex
  - aurora-labs
  - aurora-labs-support
  - aurora-nova-widget
  - aurora-nova-widget-v2-beta
  - battery-specification
  - customer-support
  - data-loss-on-factory-reset
last_updated: "2026-09-01T21:22:31.631894+00:00"
sidebar_label: Customer Support
slug: /customer-support
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Customer Support

## Overview
Customer support for [Aurora Labs](./aurora-labs.md) handles [troubleshooting](./troubleshooting.md), bug intake, and product inquiries regarding [hardware](./hardware.md) such as the [Aurora Nova Widget](./aurora-nova-widget.md) and its v2 beta. Support operations cover software issues (such as [firmware bugs](./firmware-bugs.md), wifi reconnection failures, and mesh rejoin loops) as well as hardware and specification clarifications (such as battery types and water-resistance ratings). 

## Key Details
- **Wi-Fi Reconnection Issues (NOVA-59):** Beta testers have reported that the Nova Widget fails to reconnect to Wi-Fi after power outages, getting stuck blinking blue on firmware version 0.3.8. 
  - *Workaround:* Instead of a factory reset (which causes a loss of sensor history), users can try holding the side button for 3 seconds for a soft Wi-Fi-only reset. Setting a static DHCP reservation on the router can also mitigate changed-IP connection drops.
- **[MeshSync](./meshsync.md) Rejoin Loop (Ticket #2099):** Adding large numbers of nodes (e.g., 8th node) can cause the mesh network to stop reporting until power-cycled. Agents recommend staying at 6 nodes until fixes arrive in [firmware updates](./firmware-updates.md).
- **[Battery Specifications](./battery-specifications.md):** Clarifications have resolved discrepancies regarding the battery size; the correct specification is CR2032 (correcting an earlier blog teardown typo referencing CR2450). [Battery life](./battery-life.md) expectations vary between 18 months and 2 years depending on node count and read intervals (15 minutes default).
- **Water Resistance:** The Aurora Nova Widget carries an IP54 rating during its beta phase, which differs from competitors like the [SenseNode SN-400](./sensenode-sn-400.md) (IP67). Users requiring outdoor durability are advised to use protective covers.

## Related Entities
- **Aurora Labs / [Aurora Labs Support](./nova-widget.md):** The manufacturing and support entity handling customer tickets and firmware troubleshooting.
- **Alex:** Author of a teardown blog that initially featured a CR2450 battery typo (subsequently corrected).
- **Jonah Park & Sam Okafor:** Aurora Labs internal team members handling firmware and triage.
- **Kevin Ostrander:** Beta tester (batch 4) who reported Wi-Fi reconnection bugs.

## Related Concepts
- **[Aurora Nova Widget v2 Beta](./nova-widget.md):** The primary smart device undergoing [beta testing](./beta-testing.md), utilizing MeshSync technology to avoid cloud subscription fees.
- **MeshSync:** A local mesh topology used by the widget, trading off complexity at scale for subscription-free operation.
- **[TeaBuddy](./teabuddy.md):** A separate product and company using a [BLE](./ble.md) kitchen app, frequently confused by customers who request cross-app integration.

## Contradictions
&gt; **Contradiction:** Customer-facing [documentation](./documentation.md) and marketing materials have historically contained conflicting duration metrics and [hardware specs](./hardware-specs.md). Marketing materials have advertised a "2 year battery" life, whereas forum reports and customer feedback frequently reference an "18 month" duration depending on node counts and read intervals. Similarly, initial teardowns and documentation conflicted over whether the battery was a CR2450 or CR2032 (resolved in favor of CR2032).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-11-nova-59-customer-wifi-complaint.eml` | email | Medium |
| 2 | `emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |
| 3 | `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt` | text | Unverified |
| 4 | `samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt` | text | Unverified |
| 5 | `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt` | text | Unverified |
| 6 | `transcripts/TEST-support-ticket.txt` | text | Medium |

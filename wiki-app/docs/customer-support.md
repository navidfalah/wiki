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
last_updated: "2026-09-01T19:18:22.411335+00:00"
sidebar_label: Customer Support
slug: /customer-support
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Customer Support

## Overview
Customer support at [Aurora Labs](./aurora-labs.md) handles inquiries, [bug reports](./bug-reports.md), and technical [troubleshooting](./troubleshooting.md) for products such as the [Aurora Nova Widget v2 beta](./aurora-labs.md). Support operations involve triage between support agents, [firmware](./firmware.md) engineers (such as Jonah), and management, addressing issues ranging from Wi-Fi reconnection bugs and [mesh networking](./mesh-networking.md) limits to [hardware](./hardware.md) [documentation](./documentation.md) discrepancies.

## Key Details

### Wi-Fi Reconnection and Power Outages (NOVA-59)
* **Issue:** Beta testers running firmware version 0.3.8 have reported that the Aurora Nova Widget gets stuck blinking blue and fails to reconnect to Wi-Fi after unclean power losses or power outages.
* **Impact:** Factory resetting the device to resolve the connection failure results in the loss of stored sensor history (e.g., 3 weeks of data).
* **Troubleshooting & Workarounds:**
  * **Soft Reset:** Instead of a factory reset, hold the side button for 3 seconds to perform a soft Wi-Fi-only reset, which preserves sensor history.
  * **Static IP:** Setting a static DHCP reservation for the widget's MAC address in the home router configuration can mitigate reconnection failures tied to IP address changes.
  * **Diagnostics:** Router logs, particularly DHCP lease renewal timestamps, help debug state-corruption bugs (tracked internally alongside similar state-corruption classes like [MESH-118](./mesh-118.md)).

### MeshSync Rejoin Loop (Ticket #2099)
* **Issue:** Adding an 8th node to the mesh can cause the entire mesh network to stop reporting for hours. 
* **Workaround:** Support recommends limiting deployments to a maximum of 6 nodes until a permanent patch is released in firmware version 0.3.8.
* **Tradeoffs:** MeshSync allows users to avoid cloud subscription fees, though it introduces complexity at scale compared to alternative products like the [SenseNode SN-400](./sensenode-sn-400.md).

### Battery Specifications and Documentation (Ticket #2201)
* **Battery Type:** The correct battery specification for the Aurora Nova Widget is the **CR2032** coin cell. 
* **Documentation Corrections:** Early confusion arose when a teardown blog by Alex mistakenly listed the battery as a CR2450. The blog was corrected on June 20, 2026, and the wiki and support documentation have been updated accordingly.
* **[Battery Life](./battery-life.md):** Marketing materials typically state a 2-year battery life, while forums suggest 18 months. Actual longevity depends on node count and read intervals (with a 15-minute default interval), and a comprehensive [power budget](./power-budget.md) document is slated for release.

## Related Entities
* **Aurora Labs:** Creator of the Aurora Nova Widget and MeshSync technology.
* **Kevin Ostrander:** Beta tester (batch 4) who reported the Nova Widget Wi-Fi reconnection issue.
* **Sam Okafor & Jonah Park:** Aurora Labs team members involved in support triage and firmware engineering.
* **[Mira](./aurora-labs.md):** Support agent handling customer tickets.
* **SenseNode (SN-400):** A competing product often compared for its simpler topology, cloud subscription model, and waterproof rating.
* **[TeaBuddy](./teabuddy.md):** An unrelated [BLE](./ble.md) kitchen app and product by a different company; it does not share the Aurora Nova app.

## Related Concepts
* **MeshSync:** A local mesh networking protocol used by Aurora products to avoid cloud subscription fees.
* **IP Rating:** Comparison of environmental protection ratings (Aurora Nova Widget features an IP54 rating, whereas competing devices like the SenseNode feature IP67).
* **Firmware Version 0.3.8:** Target release for fixes concerning the MeshSync rejoin loop and Wi-Fi state handling.

## Contradictions
&gt; **Contradiction:** Customer support documentation and marketing materials contain conflicting battery life estimates. While marketing materials cite a **2-year battery life**, customer forums and field reports frequently estimate battery longevity closer to **18 months**. Actual performance varies based on node count and read intervals.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-11-nova-59-customer-wifi-complaint.eml` | email | Medium |
| 2 | `emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |
| 3 | `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt` | text | Unverified |
| 4 | `samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt` | text | Unverified |
| 5 | `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt` | text | Unverified |
| 6 | `transcripts/TEST-support-ticket.txt` | text | Medium |

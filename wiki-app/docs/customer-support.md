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
last_updated: "2026-09-02T06:39:10.283479+00:00"
sidebar_label: Customer Support
slug: /customer-support
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Customer Support

## Overview
The Customer Support operations at [Aurora Labs](./aurora-labs.md) manage user inquiries, bug triage, and [troubleshooting](./troubleshooting.md) for [hardware](./hardware.md) and software offerings, notably the [Aurora Nova Widget](./aurora-nova-widget.md) and its v2 beta program. Support channels coordinate closely with engineering teams (such as Sam Okafor and Jonah Park) to address [firmware issues](./firmware-issues.md), connectivity dropouts, and [documentation](./documentation.md) discrepancies.

## Key Details

### Nova Widget v2 Beta Issues & Bug Triage
* **Wi-Fi Reconnection (NOVA-59):** Following an unclean power loss or router update on firmware version 0.3.8, the Nova Widget can get stuck blinking blue and fail to rejoin home Wi-Fi. 
  * *Workaround:* Instead of a full factory reset (which causes data loss of sensor history), users are advised to hold the side button for 3 seconds to perform a soft Wi-Fi-only reset. Setting a static DHCP reservation can also prevent IP-change reconnections.
* **[MeshSync](./meshsync.md) Rejoin Loop (Ticket #2099):** Adding 8 or more nodes can cause the mesh network to stop reporting for hours. 
  * *Workaround:* Recommended to stay at a limit of 6 nodes until the firmware patch (ETA in 0.3.8) is applied.

### Battery Specifications & Documentation
* **Battery Type:** Official specifications state the Nova Widget uses a **CR2032** coin cell battery. 
* **[Battery Life](./battery-life.md):** Marketing materials list a 2-year lifespan, while forum reports suggest 18 months. Actual battery longevity depends on node count and read interval (defaulting to 15 minutes).

### Product Distinctions & Competitors
* **Aurora Nova Widget vs. [TeaBuddy](./teabuddy.md):** Support frequently fields questions regarding cross-compatibility. The Nova Widget and the [TeaBuddy puck](./teabuddy.md) are entirely different products from separate companies utilizing different applications (Nova uses the MeshSync garden app; TeaBuddy uses a [BLE](./ble.md) kitchen app).
* **Aurora Nova Widget vs. [SenseNode SN-400](./sensenode-sn-400.md):** 
  * SenseNode offers an IP67 waterproof rating and a simpler topology with a cloud subscription.
  * Aurora Nova Widget features an IP54 rating (outdoor use recommended with a cover) and uses MeshSync to avoid cloud subscription fees.

## Related Entities
* **[Aurora Labs Support](./aurora-nova-widget-v2.md):** The primary support team handling customer interactions.
* **Sam Okafor & Jonah Park:** Engineering contacts handling firmware-side tracking (e.g., [MESH-118](./mesh-118.md) and state-corruption bugs).
* **Alex:** Author of the teardown blog associated with initial battery specification typos.
* **[Mira](./aurora-nova-widget-v2.md):** Support agent handling tickets regarding MeshSync loops and battery documentation.

## Related Concepts
* **Firmware Version 0.3.8:** The target build addressing various mesh rejoin loops and Wi-Fi state persistence [bug fixes](./bug-fixes.md).
* **MeshSync:** A decentralized protocol avoiding cloud fees, introducing scaling complexities at high node counts.
* **IP Ratings:** Comparative durability standards (IP54 for Aurora Nova vs. IP67 for SenseNode).

## Contradictions

&gt; **Contradiction:** Discrepancies exist regarding [battery specifications](./battery-specifications.md) and longevity claims. An early teardown blog post by Alex listed the battery as a CR2450, whereas official product documentation and wikis specify a CR2032 (the blog was corrected on June 20, 2026). Additionally, marketing materials claim a 2-year battery life, while forum discussions and user feedback cite an 18-month duration.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-11-nova-59-customer-wifi-complaint.eml` | email | Medium |
| 2 | `emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |
| 3 | `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt` | text | Unverified |
| 4 | `samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt` | text | Unverified |
| 5 | `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt` | text | Unverified |
| 6 | `transcripts/TEST-support-ticket.txt` | text | Medium |

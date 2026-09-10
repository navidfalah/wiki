---
id: customer-support
title: Customer Support
tags:
  - aurora-labs
  - aurora-nova-widget
  - cloud-fee
  - customer-support
  - ip-rating
  - ip54-rating
  - ip67-rating
  - jonah
last_updated: "2026-09-10T14:37:49.500428+00:00"
sidebar_label: Customer Support
slug: /customer-support
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Customer Support

## Overview
Customer support for [Aurora Labs](./aurora-labs.md) encompasses handling user inquiries, [troubleshooting](./troubleshooting.md) [hardware](./hardware.md) and [firmware issues](./firmware-issues.md), managing [product specifications](./product-specifications.md), and addressing feedback from [beta testing](./beta-testing.md). Common topics include Wi-Fi reconnection handling, IP ratings, comparison against competitors like [SenseNode](./sensenode.md), and differences across product lines such as the [Aurora Nova Widget](./aurora-nova-widget.md), [SenseNode SN-400](./sensenode-sn-400.md), and [TeaBuddy puck](./teabuddy.md).

## Key Details

### Nova Widget Wi-Fi Reconnection (NOVA-59)
- **Issue:** A known bug (tracked as NOVA-59) affects firmware version 0.3.8, where the Nova Widget fails to automatically rejoin the home Wi-Fi network following an unclean power loss (such as a power outage), getting stuck blinking blue.
- **Data Loss:** Full factory resets wipe accumulated local sensor history (e.g., 3 weeks of data). 
- **Workarounds:**
  - Avoid immediate factory resets; instead, hold the side button for 3 seconds to perform a soft Wi-Fi-only reset, which preserves sensor history.
  - Setting a static DHCP reservation for the widget's MAC address in the router can mitigate issues related to dropped or changed IPs.
- **Internal Tracking:** The bug is logged under NOVA-59 and involves firmware-side investigation by Jonah Park, as it may share state-corruption classes with [MESH-118](./mesh-118.md).

### Waterproofing and IP Ratings
- **Aurora Nova Widget:** Features an **IP54** rating, making it vulnerable to heavy rain or immersion if installed unprotected outdoors (such as in garden raised beds). Support recommends physical covers or placing units under shelter.
- **SenseNode SN-400:** Features an **IP67** rating, offering higher water and dust resistance for outdoor environments.
- **Tradeoffs:** The choice of IP54 for the Nova Widget stems from cost and tooling tradeoffs during the beta phase, which focuses on local mesh performance and open data export. An IP65 upgrade is noted on the roadmap.
- **TeaBuddy Puck:** Designed as a splash-resistant kitchen accessory rather than an outdoor waterproof device.

### Fees and Ecosystem
- **[MeshSync](./meshsync.md) / Cloud Fees:** The MeshSync system operates without a cloud fee.

## Related Entities
- **Aurora Labs**
- **Aurora Nova Widget**
- **SenseNode SN-400**
- **TeaBuddy puck**
- **Kevin Ostrander** (Beta tester, batch 4)
- **Sam Okafor** (Support team)
- **Jonah Park** (Firmware / engineering team)

## Related Concepts
- **IP Ratings (IP54 vs. IP67)**
- **Firmware State Corruption (NOVA-59 and MESH-118)**
- **Wi-Fi Supplicant State**
- **Local [Mesh Networking](./mesh-networking.md)**

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/ideas/emails/2026-06-11-nova-59-customer-wifi-complaint.eml` | email | Medium |
| 2 | `notes/ideas/emails/2026-06-11-nova-59-support-triage.eml` | email | Medium |
| 3 | `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt` | text | Unverified |
| 4 | `transcripts/TEST-support-ticket.txt` | text | Medium |

---
id: supply-chain
title: Supply Chain
tags:
  - audit-trail
  - aurora-labs
  - grace-liu
  - mira-chen
  - partial-shipment-contingency
  - partial-shipment-mitigation
  - powercell-supply
  - powercell-supply-co
last_updated: "2026-09-10T14:40:50.593166+00:00"
sidebar_label: Supply Chain
slug: /supply-chain
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Supply Chain

## Overview
This wiki page covers [supply chain management](./supply-chain-management.md) logistics, [vendor communications](./vendor-communications.md), and contingency management for component acquisition at [Aurora Labs](./aurora-labs.md), specifically concerning battery cell restocks for [MeshSync production](./meshsync-production.md) batches.

## Key Details
- **Order Details:** Order #PC-88213 for 2,400 CR2477 cells intended for [MeshSync batch 5](./meshsync-batch-5.md).
- **Supply Chain Disruption:** A customs hold at the cathode supplier in Shenzhen caused a 9-business-day delay, moving the revised full shipment date from June 9, 2026, to June 18, 2026.
- **Mitigation Strategy:** Aurora Labs opted for a partial split-shipment contingency. PowerCell Supply Co. will air-ship 600 cells from their Ontario warehouse by June 8, 2026, to cover field units and bench [testing](./testing.md) for [firmware](./firmware.md) version 0.3.9 retests. The remaining 1,800 cells will follow by truck on the delayed schedule.
- **Cost & Compliance:** There is no cost change for the expedited air shipment. [Mira Chen](./aurora-nova-widget-v2.md) requested that Grace Liu ensure the air freight surcharge waiver is properly documented for the audit trail.

## Related Entities
- **Aurora Labs:** The receiving organization [manufacturing](./manufacturing.md) MeshSync [hardware](./hardware.md) (represented by Mira Chen and Grace Liu).
- **PowerCell Supply Co.:** The vendor supplying the CR2477 battery cells (represented by account manager Rosa Delgado).
- **Mira Chen:** Aurora Labs personnel who evaluated the delay options and authorized the split shipment.
- **Grace Liu:** Aurora Labs personnel tasked with verifying the paper trail and audit [documentation](./documentation.md) for the freight surcharge waiver.
- **Rosa Delgado:** Account Manager at PowerCell Supply Co. who communicated the delay and proposed mitigation options.

## Related Concepts
- **Partial Shipment Contingency:** Utilizing staggered deliveries (air freight followed by ground transport) to prevent manufacturing or firmware testing bottlenecks caused by supplier delays.
- **Audit Trail:** Maintaining proper documentation of vendor concessions, such as air freight surcharge waivers, for accountability and tracking.
- **Firmware Retest Window:** Time-sensitive testing schedules (such as version 0.3.9 for MeshSync batch 5) that depend on steady hardware and component availability.

## Contradictions
*(No contradictions present in the current source data.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-04-mesh-118-vendor-battery-delay-reply.eml` | email | Medium |
| 2 | `emails/2026-06-04-mesh-118-vendor-battery-delay.eml` | email | Medium |
| 3 | `notes/ideas/emails/2026-06-04-mesh-118-vendor-battery-delay-reply.eml` | email | Medium |
| 4 | `notes/ideas/emails/2026-06-04-mesh-118-vendor-battery-delay.eml` | email | Medium |

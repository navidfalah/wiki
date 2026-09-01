---
id: supply-chain-management
title: Supply Chain Management
tags:
  - audit-trail-documentation
  - aurora-labs
  - customs-hold
  - grace-liu
  - mira-chen
  - order-delay-resolution
  - powercell-supply
  - powercell-supply-co
last_updated: "2026-09-01T21:25:48.509112+00:00"
sidebar_label: Supply Chain Management
slug: /supply-chain-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Supply Chain Management

## Overview
Supply chain management involves coordinating logistics, [vendor communications](./vendor-communications.md), and inventory delivery schedules to ensure manufacturing and testing timelines remain uninterrupted. A notable supply chain incident occurred in June 2026 regarding order `#PC-88213` between [Aurora Labs](./aurora-labs.md) and PowerCell Supply Co., involving CR2477 cells needed for the [MeshSync](./meshsync.md) batch 5 production.

## Key Details
* **Vendor & Order:** PowerCell Supply Co. (Account Manager: Rosa Delgado) managed order `#PC-88213` for 2,400 CR2477 cells destined for Aurora Labs' MeshSync batch 5.
* **Disruption:** A customs hold in Shenzhen affecting PowerCell's cathode supplier caused a 9-business-day delay, pushing the original June 9th ship date back to June 18th.
* **Resolution Strategy:** To prevent [firmware](./firmware.md) retest delays, Aurora Labs ([Mira Chen](./nova-widget.md)) opted for a split shipment proposed by PowerCell:
  * 600 cells shipped via air freight from the Ontario warehouse by June 8th (providing sufficient buffer for the 0.3.9 retest on batch 5 units and bench testing).
  * The remaining 1,800 cells to follow via truck on the delayed schedule.
* **Cost & [Documentation](./documentation.md):** The split air freight incurred no cost change to Aurora Labs ("this one is on us"). Mira Chen requested that Grace Liu ensure the air freight surcharge waiver is properly documented for the audit trail.

## Related Entities
* **Aurora Labs:** The recipient organization relying on the cell restock for firmware testing and field units.
* **PowerCell Supply Co.:** The vendor supplying the CR2477 cells.
* **Mira Chen:** Senior representative at Aurora Labs managing the order response and testing buffers.
* **Rosa Delgado:** Account Manager at PowerCell Supply Co. who communicated the delay and proposed solutions.
* **Grace Liu:** Aurora Labs staff member tasked with confirming paper trail documentation for the freight surcharge waiver.

## Related Concepts
* **Audit Trail Documentation:** The practice of recording administrative decisions, such as freight surcharge waivers, for compliance and review.
* **Customs Hold:** A regulatory border stoppage (in this case, in Shenzhen) affecting raw component suppliers.
* **Order Delay Resolution:** Mitigating strategies like split shipments to balance vendor constraints with strict production or testing windows.

## Contradictions
*(No contradictions present in the provided source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-04-mesh-118-vendor-battery-delay-reply.eml` | email | Medium |
| 2 | `emails/2026-06-04-mesh-118-vendor-battery-delay.eml` | email | Medium |

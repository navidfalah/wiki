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
last_updated: "2026-09-01T19:21:43.232480+00:00"
sidebar_label: Supply Chain Management
slug: /supply-chain-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Supply Chain Management

## Overview
Supply Chain Management encompasses the coordination, procurement, and logistics involved in maintaining production timelines and component inventories. A prominent example involves component restocks for [Aurora Labs](./aurora-labs.md)' MeshSync batch 5 production, managed alongside vendor PowerCell Supply Co. to navigate unexpected shipping disruptions without incurring additional costs.

## Key Details
- **Order Details:** Order #PC-88213 involves 2,400 CR2477 cells designated for MeshSync batch 5.
- **Supply Disruption:** A cathode supplier experienced a customs hold in Shenzhen, creating a 9-business-day delay that pushed the revised full ship date from June 9th to June 18th, 2026.
- **Resolution Strategy:** To prevent [Firmware](./firmware.md) retest delays, a split shipment was chosen: 600 cells were scheduled to air-ship by June 8th from the Ontario warehouse to cover field and bench testing units (~40 needed for the field group, with buffer for bench testing), while the remaining 1,800 cells would follow by truck.
- **Cost and [Documentation](./documentation.md):** PowerCell Supply Co. absorbed the cost of the split shipment with no price change. [Mira Chen](./aurora-labs.md) requested that Grace Liu confirm the air freight surcharge waiver is properly documented for the audit trail.

## Related Entities
- **Aurora Labs:** The recipient organization managing product firmware and testing.
- **PowerCell Supply Co.:** The vendor supplying the CR2477 cells.
- **Mira Chen:** Team member at Aurora Labs who evaluated options and authorized the split shipment.
- **Grace Liu:** Team member at Aurora Labs (cc'd) tasked with confirming the audit trail for the air freight surcharge waiver.
- **Rosa Delgado:** Account Manager at PowerCell Supply Co. who communicated the delay and proposed the resolution options.

## Related Concepts
- **Order Delay Resolution:** Mitigating production bottlenecks through alternative shipping methods (e.g., split air and ground shipments).
- **Audit Trail Documentation:** Ensuring administrative compliance and paper trails for vendor waivers, surcharges, and shipping adjustments.
- **Customs Hold:** Regulatory or inspection delays at international borders (such as Shenzhen) that impact upstream manufacturing components.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-04-mesh-118-vendor-battery-delay-reply.eml` | email | Medium |
| 2 | `emails/2026-06-04-mesh-118-vendor-battery-delay.eml` | email | Medium |

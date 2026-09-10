---
id: vendor-management
title: Vendor Management
tags:
  - audit-trail
  - aurora-labs
  - grace-liu
  - mira-chen
  - powercell-supply
  - rosa-delgado
  - split-shipment
  - vendor-management
last_updated: "2026-09-10T14:41:03.680443+00:00"
sidebar_label: Vendor Management
slug: /vendor-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Vendor Management

## Overview
Vendor management encompasses the coordination, communication, and logistical planning between organizations and their external suppliers. In the context of [manufacturing](./manufacturing.md) and [supply chain](./supply-chain.md) operations for projects like [MeshSync](./meshsync.md), effective vendor management ensures that component delays are mitigated with minimal impact on production schedules and [testing](./testing.md) [protocols](./protocols.md).

## Key Details
* **Order Reference:** Order `#PC-88213` with PowerCell Supply involving a cell restock delay affecting the [MeshSync Batch 5](./meshsync-batch-5.md) production.
* **Logistical Solution:** A split shipment approach was agreed upon, consisting of 600 cells delivered via air freight on the 8th of June, 2026.
* **Testing Requirements:** The initial air freight batch covers the 0.3.9 retest on batch 5 units. While the field group requires only about 40 cells, a larger buffer of 600 cells was requested to accommodate bench testing.
* **Audit Trail & Compliance:** Mira Chen requested that Grace Liu ensure the air freight surcharge waiver is properly documented for the audit trail, maintaining a clear paper trail despite no anticipated cost changes.

## Related Entities
* **Mira Chen:** [Aurora Labs](./aurora-labs.md) representative coordinating the shipment and testing buffer requirements (`mira.chen@auroralabs.example`).
* **Rosa Delgado:** PowerCell Supply representative managing the vendor side and turnaround (`rosa.delgado@powercell-supply.example`).
* **Grace Liu:** Aurora Labs team member tasked with verifying the audit trail and [documentation](./documentation.md) (`grace.liu@auroralabs.example`).
* **PowerCell Supply:** External vendor providing cell restock supplies.
* **Aurora Labs:** Receiving organization managing MeshSync batch production.

## Related Concepts
* **Split Shipment:** A logistical strategy used to deliver urgent portions of an order ahead of the main supply to prevent production or testing bottlenecks.
* **Audit Trail:** The practice of recording administrative and financial communications, agreements, and waivers to ensure accountability and compliance.
* **Bench Testing & Field Testing:** [Quality Assurance](./quality-assurance.md) phases requiring specific quantities of component cells prior to full deployment.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-04-mesh-118-vendor-battery-delay-reply.eml` | email | Medium |

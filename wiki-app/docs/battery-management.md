---
id: battery-management
title: Battery Management
tags:
  - aurora-labs
  - battery-management
  - grace-liu
  - jonah-park
  - lena-ito
  - mesh-118
  - mesh-capacity-workstream
  - mira-chen
last_updated: "2026-09-10T14:37:19.924906+00:00"
sidebar_label: Battery Management
slug: /battery-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Battery Management

## Overview
Battery management encompasses the sourcing, [supply chain](./supply-chain.md) logistics, and [firmware](./firmware.md)-level power optimization for [Aurora Labs](./aurora-labs.md)' [hardware](./hardware.md) units. This topic covers component supply updates (such as cell restock delays impacting production batches) and [QA testing](./qa-testing.md) [protocols](./protocols.md) designed to monitor and prevent regressions in [battery drain](./battery-drain.md) caused by [firmware updates](./firmware-updates.md) like the [MESH-118](./mesh-118.md) relay radio sleep timer fix.

## Key Details
- **Supply Chain & Orders**: 
  - Order `#PC-88213` involves 2,400 CR2477 cells intended for [MeshSync Batch 5](./meshsync-batch-5.md).
  - A customs hold at the Shenzhen cathode supplier caused a 9-business-day delay, moving the revised ship date from June 9th to June 18th, 2026.
  - PowerCell Supply Co. (Rosa Delgado) offered an alternative split shipment: air-shipping 600 cells from the Ontario warehouse by June 8th to cover initial field units, with the remaining 1,800 cells following by truck.
- **Firmware Validation & QA (MESH-118)**:
  - The 0.3.9 candidate test plan targets the relay radio sleep timer fix.
  - Testing scope utilizes 6 bench units across mesh sizes of 3, 6, and 9 nodes (deliberately pushing past the flash-before warning threshold to observe degradation).
  - Battery drain is measured hourly over a 48-hour period per [configuration](./configuration.md).
  - The pass criteria requires drain to remain within 10% of the 0.3.7 baseline (pre-relay-mode) at 6 nodes or fewer.

## Related Entities
- **Aurora Labs**: Organization managing [product development](./product-development.md), QA, and firmware engineering.
- **PowerCell Supply Co.**: Supplier providing battery cells (contact: Rosa Delgado).
- **[Mira Chen](./aurora-nova-widget-v2.md)**: Recipient of supply chain updates and CC'd on QA standup communications.
- **Grace Liu**: CC'd on supplier communications regarding order delays.
- **Lena Ito**: Author of the MESH-118 QA retest plan.
- **Jonah Park**: Engineering team member responsible for building firmware updates.

## Related Concepts
- **MESH-118**: Ticket and identifier covering the relay radio sleep timer fix and its associated 0.3.9 QA retest plan.
- **Mesh-Capacity Workstream**: A separate workstream handling high-stress configurations (such as the 12-node stress config from MESH-102), which is explicitly excluded from standard battery regression checks.
- **MeshSync Batch 5**: Production batch impacted by battery cell supply delays.

## Contradictions
*(No direct contradictions found across the provided sources.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/ideas/emails/2026-06-04-mesh-118-vendor-battery-delay.eml` | email | Medium |
| 2 | `notes/ideas/emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |

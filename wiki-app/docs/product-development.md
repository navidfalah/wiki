---
id: product-development
title: Product Development
tags:
  - alex-kim
  - aurora-labs
  - battery-target
  - bridge-financing
  - data-ownership
  - ip-rating-trade-offs
  - jonah-park
  - meshsync
last_updated: "2026-09-10T14:39:47.546156+00:00"
sidebar_label: Product Development
slug: /product-development
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Development

## Overview
Product Development at [Aurora Labs](./aurora-labs.md) focuses on creating open-source [sensors](./sensors.md) tailored for gardeners who value data ownership. The flagship product under development is the [Nova Widget](./nova-widget.md), a soil moisture and temperature sensor utilizing [MeshSync](./meshsync.md) technology for extended range. 

## Key Details
- **Flagship Product**: Nova Widget (soil moisture and temperature sensor).
- **Core Technology**: 
  - MCU: nRF52840.
  - Range Extension: MeshSync (version 0.3.8 shipped, featuring a rejoin fix that unblocks 8-node deployments).
- **Traction & Status**: 
  - 47 beta Nova Widget units currently deployed in the field.
  - A [wiki compiler](./wiki-compiler.md) demo successfully impressed seed investors.
- **[Manufacturing](./manufacturing.md) & Trade-offs**: 
  - IP65 tooling costing $8k was deferred; the team is currently shipping an IP54 beta version accompanied by clear splash-resistance language.
  - Competes with products like the [SenseNode SN-400](./sensenode-sn-400.md), which maintains the outdoor waterproof narrative with an IP67 rating.
- **Financial & Operations**: 
  - Seeking a $500k bridge financing round dedicated to injection molding and 2 full-time equivalent (FTE) [firmware](./firmware.md) engineers.

## Related Entities
- **Aurora Labs**: The company developing the Nova Widget and managing the project.
- **[Mira Chen](./aurora-nova-widget-v2.md)**: CEO of Aurora Labs and author of the investor update drafts.
- **Jonah Park**: Team member present during the initial [project kickoff](./project-kickoff.md) meeting.
- **Alex Kim**: Reached out regarding co-[marketing](./marketing.md) at Maker Faire (deferred until Aurora beta ships; discussion limited to a shared CR2032 [supply chain](./supply-chain.md) joke).
- **SenseNode SN-400**: A competing product holding an outdoor waterproof IP67 rating.

## Related Concepts
- **Data Ownership**: The founding philosophy ensuring gardeners retain control over their sensor data.
- **MeshSync**: Proprietary or project-specific mesh synchronization protocol used to enhance device range and multi-node deployments.
- **Bridge Financing**: The $500k fundraising target aimed at covering tooling and engineering personnel costs.

## Contradictions
&gt; **Contradiction:** Internal [documentation](./documentation.md) contains conflicting [battery life](./battery-life.md) claims, stating both a 2-year lifespan and an 18-month target. The team plans to resolve this by publishing a comprehensive [power budget](./power-budget.md) spreadsheet in Q3.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/TEST-kickoff-meeting.txt` | text | Medium |
| 2 | `samples/2026-07-04-investor-update-draft.txt` | text | Unverified |

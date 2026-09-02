---
id: product-management
title: Product Management
tags:
  - alex-kim
  - aurora
  - aurora-mira
  - backlog-grooming
  - beta-nps
  - contradiction-flagging
  - icebox
  - jamie-qa
last_updated: "2026-09-02T06:41:32.953391+00:00"
sidebar_label: Product Management
slug: /product-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Management

## Overview
This wiki page compiles recent updates, [backlog grooming](./backlog-grooming.md) notes, and cross-functional product discussions for [TeaBuddy](./teabuddy.md) and related product lines, covering product operations, packaging issues, telemetry metrics, and prioritization.

## Key Details
- **TeaBuddy Packaging Issue**: The herbal box copy currently reads "5 minutes" in print proof v3, creating a discrepancy across [documentation](./documentation.md) and assets.
  - [Firmware](./firmware.md) brew time: 7 minutes.
  - Marketing PDF: 5 minutes.
  - Wiki documentation: 7 minutes (updated after the last compile).
  - Sam Rivera rejected using a sticker overlay and requested the print file be fixed directly.
- **Beta Metrics**: TeaBuddy beta Net Promoter Score (NPS) raw score stands at 42, with pairing complaints decreasing following the release of version 0.9.3.
- **[Partnerships](./partnerships.md)**: [Aurora Mira](./aurora-nova-widget-v2.md) inquired about a shared booth; Sam Rivera declined unless they cover half the cost.
- **Backlog Grooming (July 10)**:
  - *Aurora P0 priorities*: Publish [power budget](./power-budget.md) spreadsheet, 0.3.9 rejoin hardening, and comparison page for the [SenseNode SN-400](./sensenode-sn-400.md).
  - *TeaBuddy P0 priorities*: Android v1.1 beta, TB-142 cancel bug verification, and a box copy audit for all presets.
  - *Shared Icebox*: Plant Whisperer app (#47), contradiction linter, and wiki index auto-refresh.
  - *Quick Wins*: Add 40 extended dummy raw files for compiler stress tests and fix forum scrape thread #9102.
  - *Stale Items*: Rename [MeshSync](./meshsync.md) to MeshSink (rejected again) and KarpathyGarden product name (rejected again).

## Related Entities
- **Alex Kim**: Product team member focused on copy, widget design, and documentation updates.
- **Jamie QA**: Quality assurance team member tracking firmware builds, bugs, and beta NPS metrics.
- **Sam Rivera**: Leadership/stakeholder enforcing print corrections and partnership decisions regarding Aurora Mira.
- **Aurora Mira**: External entity inquiring about a shared exhibition booth.

## Related Concepts
- **Backlog Grooming**: Prioritization process dividing tasks into P0 priorities, shared iceboxes, quick wins, and stale items.
- **Beta NPS**: Customer satisfaction tracking for beta releases (currently at 42 for TeaBuddy).
- **Firmware vs. Marketing Discrepancies**: Managing conflicting information across device firmware, marketing materials, and internal wikis.

## Contradictions
&gt; **Contradiction:** There is a persistent discrepancy regarding the TeaBuddy steep/brew time: the firmware is configured for 7 minutes and the wiki lists 7 minutes following the last compile, whereas the marketing PDF and print proof v3 incorrectly state 5 minutes.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-06-slack-dump-product.txt` | text | Unverified |
| 2 | `samples/ideas/[SAMPLE]-2026-07-10-backlog-grooming-snippet.txt` | text | Unverified |

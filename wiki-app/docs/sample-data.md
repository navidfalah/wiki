---
id: sample-data
title: Sample Data
tags:
  - alex
  - aurora-labs
  - domain-replacement
  - greengrid-hub
  - intentional-contradictions
  - meshsync
  - nova-widget
  - sample-data
last_updated: "2026-09-10T14:40:24.281487+00:00"
sidebar_label: Sample Data
slug: /sample-data
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Sample Data

## Overview
Sample data is intentionally designed to conflict across various topics to exercise cross-linking, analytics, and human review systems within the [Aurora Labs](./aurora-labs.md) ecosystem. It provides structured file markers, [cross-company storylines](./cross-company-storylines.md), and guidelines on how wiki pages emerge from procedural forum scrapes and how to replace the entire domain with custom sources.

## Key Details
- **Intentional Conflicts:** The sample dataset contains built-in discrepancies across specifications, [marketing](./marketing.md) materials, and internal notes to test analytical and review workflows.
- **File Markers:** Recognizable markers are used in filenames, such as `[SAMPLE]` (e.g., `[SAMPLE]-2026-06-14-teabuddy-standup.txt`) and `[DUMMY-TEST-DATA]` (e.g., `bulk/[DUMMY-TEST-DATA]-greengrid-forum-scrape-395-2026-07-16.txt`).
- **Wiki Page Generation Pipeline:** 
  1. *Extraction:* Pulls topics from `## Summary`, entities from GreenGrid Hub, and concepts from [MeshSync](./meshsync.md).
  2. *Grouping:* Joins chunks with hundreds of other related mentions.
  3. *Output:* Generates cross-linked pages such as `meshsync.md` and `greengrid-hub.md`.
  4. *MOC:* Automatically lists pages under "Engineering & [Protocols](./protocols.md)" or "Products & [Hardware](./hardware.md)" based on tags.
- **Replacing the Domain:** 
  1. Remove or archive `data/raw/`.
  2. Add your own source files.
  3. Run `python main.py --force`.
  4. Update the "[Aurora Labs Wiki](./aurora-nova-widget-v2.md)" title in `wiki-app/docusaurus.config.js`.
  5. Keep the `AGENTS.md` domain section in sync for agents.

## Related Entities
- **Aurora Labs:** The primary organization associated with the wiki, [BLE](./ble.md) stack inquiries, and [hardware development](./hardware-development.md).
- **GreenGrid Hub:** An entity referenced during entity extraction and forum scrapes.
- **[Nova Widget](./nova-widget.md):** Hardware product involved in IP rating comparisons.
- **[TeaBuddy](./teabuddy.md):** External or partner entity involved in cross-company storylines (e.g., BLE stack inquiries, rejected tea timer sync requests, and rejected "GardenTea" soil/tea ideas).

## Related Concepts
- **MeshSync:** A protocol/concept frequently referenced across chunks, handling synchronization tasks and stability [testing](./testing.md).
- **Intentional Contradictions:** A testing mechanism built into the sample data to evaluate system conflict-resolution and review features.

## Contradictions
&gt; **Contradiction:** Read interval specifications conflict between kickoff slides (stating **hourly**) and technical specs (stating **15 minutes**).

&gt; **Contradiction:** [Battery life](./battery-life.md) projections differ, with marketing claiming **2 years** while engineering estimates **~18 months @ 10 nodes**.

&gt; **Contradiction:** Battery type is disputed, with Alex's blog citing **CR2450** while the product officially uses **CR2032**.

&gt; **Contradiction:** Herbal tea preset times disagree, with [firmware](./firmware.md) set to **7 min** versus old marketing copy stating **5 min**.

&gt; **Contradiction:** IP rating claims conflict between [SenseNode](./sensenode.md) (**IP67**) and the Nova Widget beta (**IP54**, splash only).

&gt; **Contradiction:** Mesh stability reports vary, noting the lab is stable at **6 nodes** while field issues emerge at **8+**.

&gt; **Contradiction:** Rejoin [power consumption](./power-consumption.md) records a spike of **110–340 µA** upon parent swap.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `18-sample-domain.md` | text | Medium |

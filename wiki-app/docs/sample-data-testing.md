---
id: sample-data-testing
title: "Sample Data & Testing"
tags:
  - aurora
  - domain-replacement
  - greengrid-hub
  - intentional-contradictions
  - meshsync
  - nova-widget
  - sample-data-testing
  - sensenode
last_updated: "2026-09-06T15:22:45.289725+00:00"
sidebar_label: "Sample Data & Testing"
slug: /sample-data-testing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Sample Data & Testing

## Overview
The sample data domain is specifically engineered to include deliberate conflicts and [cross-company storylines](./cross-company-storylines.md). It exercises system capabilities such as cross-linking, analytics, and human review while providing a foundation for procedural forum scrapes and wiki page generation.

## Key Details
- **File Markers**: Use markers like `[SAMPLE]` (e.g., `[SAMPLE]-2026-06-14-teabuddy-standup.txt`) and `[DUMMY-TEST-DATA]` (e.g., `bulk/[DUMMY-TEST-DATA]-greengrid-forum-scrape-395-2026-07-16.txt`).
- **Search Guidelines**: Raw files can be searched using keywords such as `contradiction`, `WRONG`, and `AGAIN` to locate additional test items.
- **Wiki Page Generation Flow**:
  1. *Extraction*: Topics derived from `## Summary`, entities from **GreenGrid Hub**, and concepts from **[MeshSync](./meshsync.md)**.
  2. *Grouping*: Chunks join hundreds of other MeshSync mentions.
  3. *Output*: Generates files like `meshsync.md` and `greengrid-hub.md` complete with cross-links.
  4. *MOC*: Listed under "Engineering & [Protocols](./protocols.md)" or "Products & [Hardware](./hardware.md)" based on tags.
- **Replacing the Domain**:
  1. Remove or archive `data/raw/`.
  2. Add your own sources.
  3. Execute `python main.py --force`.
  4. Update the `wiki-app/docusaurus.config.js` title from "[Aurora Labs Wiki](./aurora-nova-widget.md)".
  5. Keep the `AGENTS.md` domain section in sync for agent awareness.

## Related Entities
- **Aurora**
- **GreenGrid Hub**
- **MeshSync**
- **[Nova Widget](./nova-widget.md)**
- **[SenseNode](./sensenode-sn-400.md)**
- **[TeaBuddy](./teabuddy.md)**

## Related Concepts
- **Domain Replacement**
- **Intentional Contradictions**
- **Cross-Company Storylines**
- **Procedural Forum Scrapes**

## Contradictions
&gt; **Contradiction:** Sample data deliberately introduces conflicting specifications across multiple topics:
&gt; - **Read interval:** Kickoff slides state **hourly**, whereas the spec requires **15 minutes**.
&gt; - **[Battery life](./battery-life.md):** Marketing claims **2 years**, while engineering estimates **~18 months @ 10 nodes**.
&gt; - **Battery type:** Alex's blog mentioned **CR2450**, but the product uses **CR2032**.
&gt; - **Herbal tea preset:** [Firmware](./firmware.md) sets it to **7 min**, compared to old marketing copy specifying **5 min**.
&gt; - **IP rating:** SenseNode is listed as **IP67** versus Nova Widget beta at **IP54** (splash only).
&gt; - **Mesh stability:** Lab [testing](./testing.md) is stable at **6 nodes**, while field issues occur at **8+**.
&gt; - **Rejoin power:** Exhibits a spike of **110–340 µA** on parent swap.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `18-sample-domain.md` | text | Medium |

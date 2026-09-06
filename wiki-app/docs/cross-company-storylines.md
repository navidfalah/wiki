---
id: cross-company-storylines
title: Cross-Company Storylines
tags:
  - aurora
  - cross-company-storylines
  - domain-replacement
  - greengrid-hub
  - intentional-contradictions
  - meshsync
  - nova-widget
  - sensenode
last_updated: "2026-09-06T15:19:42.144103+00:00"
sidebar_label: Cross-Company Storylines
slug: /cross-company-storylines
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Cross-Company Storylines

## Overview
The Cross-Company Storylines topic encompasses the various interactions, partnership proposals, rejections, and collaborative explorations between different entities and product teams within the sample ecosystem. It also captures the methodology behind generating wiki pages from procedural forum scrapes and the mechanisms for replacing or updating the [sample domain](./sample-domain.md) data.

## Key Details
- **Inter-Company Inquiries & Proposals**:
  - **[TeaBuddy](./teabuddy.md) & [Aurora Nova Widget](./aurora-nova-widget.md)**: TeaBuddy reached out to Aurora regarding a shared [BLE](./ble.md) stack (tentatively scheduled for Q3). TeaBuddy also inquired about syncing tea timers using [MeshSync](./meshsync.md), which was rejected.
  - **Marketing & Collaborations**: Co-marketing at a maker faire remains pending and viewed with skepticism. A "GardenTea" soil and tea product concept was ultimately rejected.
  - **Meta References**: The [Wiki Compiler](./wiki-compiler.md) is noted as a meta-element (Idea D in the cross-product dump).
- **File Markers**:
  - `[SAMPLE]` is used for files such as `[SAMPLE]-2026-06-14-teabuddy-standup.txt`.
  - `[DUMMY-TEST-DATA]` is utilized for bulk scrapes like `bulk/[DUMMY-TEST-DATA]-greengrid-forum-scrape-395-2026-07-16.txt`.
- **Domain Replacement Procedure**:
  1. Remove or archive `data/raw/`.
  2. Add custom sources.
  3. Execute `python main.py --force`.
  4. Update the title in `wiki-app/docusaurus.config.js` (e.g., changing "[Aurora Labs](./aurora-labs.md) Wiki" to a new title).
  5. Keep the `AGENTS.md` domain section synchronized with agent knowledge requirements.

## Related Entities
- **TeaBuddy**
- **Aurora**
- **GreenGrid Hub**
- **[SenseNode SN-400](./sensenode-sn-400.md)**
- **[Nova Widget](./nova-widget.md)**

## Related Concepts
- **MeshSync**
- **Domain Replacement**
- **Procedural Forum Scrape**
- **Intentional Contradictions**

## Contradictions
&gt; **Contradiction:** Sample data deliberately incorporates conflicts across various topics to exercise cross-linking, analytics, and human review:
&gt; - **Read interval:** Kickoff slides state *hourly*, while the spec specifies *15 minutes*.
&gt; - **[Battery Life](./battery-life.md):** Marketing claims *2 years*, whereas engineering estimates *~18 months @ 10 nodes*.
&gt; - **Battery type:** Alex's blog mentioned *CR2450*, but the product actually uses *CR2032*.
&gt; - **Herbal tea preset:** [Firmware](./firmware.md) sets it to *7 min*, contrasted with old marketing copy stating *5 min*.
&gt; - **IP rating:** SenseNode is rated *IP67* versus Nova Widget beta at *IP54* (splash only).
&gt; - **Mesh stability:** Lab [Testing](./testing.md) shows stability at *6 nodes*, while field issues arise at *8+*.
&gt; - **Rejoin power:** A spike of *110–340 µA* occurs on parent swap.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `18-sample-domain.md` | text | Medium |

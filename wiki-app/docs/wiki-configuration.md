---
id: wiki-configuration
title: Wiki Configuration
tags:
  - aurora
  - domain-replacement
  - greengrid-hub
  - intentional-contradictions
  - meshsync
  - nova-widget
  - sensenode
  - teabuddy
last_updated: "2026-09-10T14:41:14.028071+00:00"
sidebar_label: Wiki Configuration
slug: /wiki-configuration
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wiki Configuration

## Overview

The Wiki [Configuration](./configuration.md) governs how raw data, [sample data](./sample-data.md), and [cross-company storylines](./cross-company-storylines.md) interact within the ecosystem. It highlights deliberate sample conflicts designed to test analytics, cross-linking, and human review, while also outlining the procedural lifecycle of wiki page emergence and the exact steps required to replace the [sample domain](./sample-domain.md) with live data.

## Key Details

- **Replacing the Domain:**
  1. Remove or archive the `data/raw/` directory.
  2. Add your own custom sources.
  3. Run `python main.py --force`.
  4. Update the title in `wiki-app/docusaurus.config.js` from "[Aurora Labs](./aurora-labs.md) Wiki" to your desired title.
  5. Keep the `AGENTS.md` domain section synchronized if [Artificial Intelligence](./artificial-intelligence.md) agents need awareness of your topic.
- **File Markers:**
  - `[SAMPLE]` (e.g., `[SAMPLE]-2026-06-14-teabuddy-standup.txt`)
  - `[DUMMY-TEST-DATA]` (e.g., `bulk/[DUMMY-TEST-DATA]-greengrid-forum-scrape-395-2026-07-16.txt`)
- **Wiki Page Emergence (Procedural Forum Scrape):**
  1. *Extraction:* Topics derived from `## Summary`, entities from GreenGrid Hub, and concepts from [MeshSync](./meshsync.md).
  2. *Grouping:* Chunks are joined with hundreds of other MeshSync references.
  3. *Output:* Generation of structured files such as `meshsync.md` and `greengrid-hub.md` complete with cross-links.
  4. *MOC (Map of Content):* Pages are cataloged under "Engineering & [Protocols](./protocols.md)" or "Products & [Hardware](./hardware.md)" based on their tags.
- **Raw File Search:** Search raw files for keywords such as `contradiction`, `WRONG`, and `AGAIN` to locate additional anomalies or notes.

## Related Entities

- **Aurora Labs** — Mentioned in the default Docusaurus configuration title and inquired by [TeaBuddy](./teabuddy.md) regarding a shared [BLE](./ble.md) stack.
- **TeaBuddy** — Product that inquired about a shared BLE stack with Aurora (slated for Q3) and requested MeshSync support for tea timers (which was rejected).
- **GreenGrid Hub** — Entity associated with forum scrapes and entity extraction workflows.
- **[SenseNode SN-400](./sensenode-sn-400.md)** — Hardware component referenced in IP rating specifications.
- **[Nova Widget](./nova-widget.md)** — Beta hardware component evaluated alongside SenseNode.

## Related Concepts

- **MeshSync** — Connectivity and synchronization concept evaluated for tea timers and grouped via procedural extraction.
- **Domain Replacement** — The systematic process of clearing sample data and initializing a custom dataset.
- **Intentional Contradictions** — Deliberate conflicting sample data used to stress-test system analytics and cross-linking.

## Contradictions

&gt; **Contradiction:** Read interval specifications conflict between kickoff slides (hourly) and the formal spec (15 minutes).

&gt; **Contradiction:** [Battery life](./battery-life.md) estimates differ, with [marketing](./marketing.md) claiming 2 years versus engineering projections of ~18 months at 10 nodes.

&gt; **Contradiction:** Battery type is disputed, where Alex's blog specified CR2450 while the actual product utilizes CR2032.

&gt; **Contradiction:** Herbal tea preset times diverge between [firmware](./firmware.md) (7 minutes) and old marketing copy (5 minutes).

&gt; **Contradiction:** IP ratings conflict across hardware iterations, citing SenseNode at IP67 versus Nova Widget beta at IP54 (splash only).

&gt; **Contradiction:** Mesh stability metrics show laboratory stability at 6 nodes contrasted with field issues occurring at 8+ nodes.

&gt; **Contradiction:** Rejoin [power consumption](./power-consumption.md) spikes between 110–340 µA upon parent swap.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `18-sample-domain.md` | text | Medium |

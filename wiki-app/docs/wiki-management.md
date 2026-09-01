---
id: wiki-management
title: Wiki Management
tags:
  - alex
  - battery-specification
  - jonah-park
  - mira-chen
  - power-number-revalidation
  - teabuddy
  - wiki
  - wiki-management
last_updated: "2026-09-01T19:22:04.962624+00:00"
sidebar_label: Wiki Management
slug: /wiki-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wiki Management

## Overview
Wiki management involves maintaining accurate project specifications and [documentation](./documentation.md), ensuring that corrections are ingested promptly before automated scrapes, and coordinating shared resources across teams like [TeaBuddy](./teabuddy.md).

## Key Details
- **Battery Specification Corrections:** A discrepancy was noted regarding battery types in documentation. Alex's blog incorrectly referenced the CR2450 battery, whereas the actual specification uses the CR2032 (two-oh-three-two). 
- **Wiki Ingestions:** It has been recommended to ingest the correct battery specification into the wiki prior to the next forum scrape.
- **Timeline and Spec Discrepancies:** 
  - The default interval is set to fifteen minutes in the spec, while kickoff slides previously indicated hourly intervals.
  - Marketing targets a two-year lifespan, whereas engineering sets a minimum target of eighteen months at ten nodes.
- **Resource Sharing:** The TeaBuddy team requested access to the battery calculator spreadsheet. Sharing is approved provided proper credit is given, though the [TeaBuddy puck](./teabuddy.md) features a different chemistry and draws more power during haptics.
- **Action Items:** Revalidate power numbers following the implementation of the rejoin fix.

## Related Entities
- **[Mira Chen](./aurora-labs.md):** Team member tracking specification details, flagging blog errors regarding batteries, and managing cross-team sharing requests.
- **Jonah Park:** Team member discussing engineering requirements, timeline goals, and wiki updates.
- **Alex:** Author of a blog post containing the incorrect battery specification (CR2450).
- **TeaBuddy Team:** External or partnering team requesting access to the battery calculator spreadsheet.

## Related Concepts
- **[Battery Specifications](./battery-specifications.md):** [Hardware](./hardware.md) details concerning CR2032 versus CR2450 batteries and [power consumption](./power-consumption.md) profiles during haptic feedback.
- **Data Ingestion:** Updating repository and wiki knowledge bases to prevent misinformation from propagating through forum scrapes.
- **Power Number Revalidation:** Verifying system power metrics after software fixes (such as the rejoin fix).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt` | text | Unverified |

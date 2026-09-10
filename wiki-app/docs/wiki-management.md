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
last_updated: "2026-09-10T14:41:15.991311+00:00"
sidebar_label: Wiki Management
slug: /wiki-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wiki Management

## Overview
Wiki management involves maintaining accurate, up-to-date [documentation](./documentation.md) and correcting technical specifications across internal knowledge bases. A key operational focus is ingesting verified corrections—such as [hardware](./hardware.md) and [battery specifications](./battery-specifications.md)—before automated forum scrapes occur to prevent the spread of misinformation across engineering and [marketing](./marketing.md) documentation.

## Key Details
* **Battery Specifications:** A correction was identified regarding a blog post by Alex which mistakenly referenced a CR2450 battery; the actual hardware uses a CR2032 battery. 
* **Wiki Ingestion:** Jonah Park emphasized the importance of ingesting this battery specification correction into the wiki promptly before the next forum scrape.
* **Documentation Discrepancies:** Conflicting timelines exist regarding system specifications; kickoff slides indicated an hourly default, whereas the specification document lists a fifteen-minute default. Marketing targets a two-year lifespan, while engineering requires an eighteen-month minimum at ten nodes.
* **External Collaborations:** The [TeaBuddy](./teabuddy.md) team requested permission to share the internal battery calculator spreadsheet. Sharing was approved on the condition of receiving proper credit, though it is noted that the TeaBuddy chemistry differs due to a higher haptic draw on pucks.
* **Action Items:** Revalidate power numbers following the implementation of the rejoin fix.

## Related Entities
* **Mira Chen:** Team member who noted specification mismatches, Alex's blog error regarding battery types, and handled the TeaBuddy spreadsheet request.
* **Jonah Park:** Team member who recommended ingesting corrections into the wiki and coordinated on the TeaBuddy collaboration terms.
* **Alex:** Author of a blog post containing an incorrect battery specification (CR2450 instead of CR2032).
* **TeaBuddy Team:** External group requesting access to the internal battery calculator spreadsheet.

## Related Concepts
* **Battery Specifications:** The distinction and standardization between CR2450 and CR2032 chemistries and haptic draw impacts.
* **Forum Scraping:** Automated data harvesting processes that necessitate clean and accurate wiki records beforehand.
* **Power Number Revalidation:** The required engineering action to verify power metrics after applying a rejoin fix.

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding default intervals; the [project kickoff](./project-kickoff.md) slides specified an hourly default, while the official specification document states a fifteen-minute default.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt` | text | Unverified |

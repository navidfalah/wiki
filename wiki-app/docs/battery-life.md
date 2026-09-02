---
id: battery-life
title: Battery Life
tags:
  - alex
  - battery-life
  - battery-specification
  - jonah-park
  - mira-chen
  - power-number-revalidation
  - teabuddy
  - wiki
last_updated: "2026-09-02T06:38:42.264849+00:00"
sidebar_label: Battery Life
slug: /battery-life
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Battery Life

## Overview
Battery life specifications and [power management](./power-management.md) are subjects of internal discussion across engineering, marketing, and external collaborations. Discrepancies exist between official spec defaults, marketing claims, engineering targets, and [documentation](./documentation.md) found on personal blogs.

## Key Details
- **Default Specifications:** The spec defaults to fifteen minutes, while kickoff slides previously stated hourly operation.
- **Engineering Targets:** Engineering targets a minimum of eighteen months at ten nodes, whereas marketing proposals may suggest up to two years.
- **Battery Component Discrepancy:** A blog post by Alex referenced the incorrect battery (CR2450); the actual [hardware](./hardware.md) uses the CR2032 (two-oh-three-two) cell.
- **Power Calculator & External Sharing:** The [TeaBuddy](./teabuddy.md) team requested access to the internal battery calculator spreadsheet. Sharing is permitted provided proper credit is given, though Jonah notes their chemistry differs due to higher puck power draws from haptics.
- **Action Items:** Power numbers are scheduled for revalidation following a rejoin fix. Wiki documentation requires updating to ingest the correct battery correction prior to the next forum scrape.

## Related Entities
- **[Mira Chen](./aurora-nova-widget-v2.md):** Team member who identified the battery error in Alex's blog and tracked the TeaBuddy team spreadsheet request.
- **Jonah Park:** Team member who noted the engineering versus marketing timeline targets and the differences in TeaBuddy's haptic power draw.
- **Alex:** Author of a blog post containing an incorrect battery specification.
- **TeaBuddy Team:** External group requesting access to the internal battery calculator spreadsheet.

## Related Concepts
- **Battery Specification:** Hardware cell selection (CR2032 vs. CR2450) and operational intervals (fifteen-minute defaults vs. hourly kickoff targets).
- **Power Management & Revalidation:** Ongoing engineering efforts to revalidate power numbers following fixes, balancing node counts and longevity targets (eighteen to twenty-four months).
- **[Wiki Maintenance](./wiki-maintenance.md):** The ingestion of corrections and data updates prior to external forum scrapes.

## Contradictions
&gt; **Contradiction:** There is an ongoing discrepancy regarding operational frequency targets. The official specification sets a default of fifteen minutes, while the kickoff slides indicated an hourly schedule. Additionally, marketing expectations suggest a two-year lifespan, whereas engineering targets an eighteen-month minimum at ten nodes.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt` | text | Unverified |

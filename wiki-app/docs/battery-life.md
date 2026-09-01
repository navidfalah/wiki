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
last_updated: "2026-09-01T19:17:54.194645+00:00"
sidebar_label: Battery Life
slug: /battery-life
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Battery Life

## Overview
Battery life considerations, specifications, and internal team debates regarding power requirements, battery models, and [documentation](./documentation.md) corrections.

## Key Details
- **Specification vs. Marketing:** The kickoff slides stated an hourly default, whereas the official specification dictates a 15-minute default. Marketing targets two years, while engineering specifies an 18-month minimum at 10 nodes.
- **Battery Model Correction:** Alex's blog incorrectly referenced a CR2450 battery; the actual specification uses the CR2032 model. A correction was noted to be ingested into the wiki.
- **Power Calculations & Revalidation:** An active action item is in place to revalidate power numbers following a recent rejoin fix.
- **External Collaboration:** The [TeaBuddy](./teabuddy.md) team requested permission to share our battery calculator spreadsheet (conditioned on proper attribution), though their chemistry differs as their puck draws more power on haptics.

## Related Entities
- **Mira Chen:** Team member highlighting specification discrepancies, blog errors, and external inquiries.
- **Jonah Park:** Team member discussing engineering minimums, marketing claims, and wiki ingestions.
- **Alex:** Author of a blog post containing an incorrect battery model reference.
- **TeaBuddy Team:** External group requesting access to the battery calculator spreadsheet.

## Related Concepts
- Battery Specification
- Power Number Revalidation
- Battery Chemistry & Haptic Draw

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the default operating interval: kickoff slides reference an hourly default, whereas the official specification mandates a 15-minute default.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt` | text | Unverified |

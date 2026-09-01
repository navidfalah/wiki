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
last_updated: "2026-09-01T21:22:04.146953+00:00"
sidebar_label: Battery Life
slug: /battery-life
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Battery Life

## Overview
Battery life considerations, specifications, and internal team discussions regarding power requirements, [hardware](./hardware.md) components, and cross-project sharing.

## Key Details
- **Specifications & Timeline Discrepancies:** The kickoff slides stated an hourly default, whereas the specification document lists a fifteen-minute default. Engineering targets an eighteen-month minimum lifespan at ten nodes, while marketing specifications may vary.
- **Battery Components:** Alex's blog previously referenced an incorrect battery model (CR2450); the correct specification utilizes the CR2032 (two-oh-three-two) battery type.
- **Power Draw & Chemistry:** The [TeaBuddy](./teabuddy.md) team requested access to the internal [battery calculator spreadsheet](./power-budget.md), which can be shared provided proper credit is given. However, the chemistry differs as the puck draws more power on haptics.
- **Action Items:** Power numbers require revalidation following a rejoin fix, and the battery correction from Alex's blog needs to be ingested into the [wiki](./wiki-management.md) prior to the next forum scrape.

## Related Entities
- **[Mira Chen](./nova-widget.md):** Team member who noted specification discrepancies, corrected the battery model, and managed the TeaBuddy spreadsheet request.
- **Jonah Park:** Team member who discussed engineering targets, marketing claims, and wiki ingestion.
- **Alex:** Author of a blog post that referenced the incorrect battery model.
- **TeaBuddy Team:** External project team that requested the battery calculator spreadsheet.

## Related Concepts
- [Battery Specification](./battery-specifications.md)
- [Power Management](./power-management.md)
- Haptic Power Draw
- [Documentation](./documentation.md) Revalidation

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding default timing intervals between the kickoff slides, which specified hourly intervals, and the official spec document, which lists a fifteen-minute default.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt` | text | Unverified |

---
id: engineering-constraints
title: Engineering Constraints
tags:
  - alex
  - battery-specification
  - engineering-constraints
  - engineering-timeline
  - jonah
  - mira
  - wiki
  - wiki-ingestion
last_updated: "2026-09-01T19:18:30.277170+00:00"
sidebar_label: Engineering Constraints
slug: /engineering-constraints
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Engineering Constraints

## Overview
This wiki page documents the operational and design parameters governing current engineering projects, capturing key specification disagreements, timeline adjustments, and [hardware](./hardware.md) corrections discussed during team sync fragments.

## Key Details
- **Timeline Constraints:** Marketing targets a two-year delivery window, but engineering requires a minimum of 18 months at a scale of 10 nodes.
- **Spec Interval Defaults:** While the specification document dictates a 15-minute default interval, initial kickoff discussions referenced an hourly default.
- **[Battery Specifications](./battery-specifications.md):** Alex's published blog post incorrectly specified the use of a CR2450 battery. The correct hardware standard is the CR2032 (two-oh-three-two).

## Related Entities
- **[Mira](./aurora-labs.md):** Emphasizes the specification document defaults and recommends ingesting hardware corrections into the wiki.
- **Jonah:** Clarifies kickoff parameters and identifies the battery specification error in Alex's blog.
- **Alex:** Author of the blog post containing the incorrect battery specification.

## Related Concepts
- **Wiki Ingestion:** The process of capturing and updating corrected information (such as [hardware specifications](./hardware-specifications.md)) directly into [documentation](./documentation.md) systems.
- **Hardware Standards:** Ensuring alignment between public-facing content (blogs) and actual engineering components (CR2032 batteries).

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding default timing intervals between the project specification, which mandates 15 minutes, and the kickoff discussion, which referenced an hourly default.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `transcripts/2026-06-05-sync-fragment.txt` | text | Medium |

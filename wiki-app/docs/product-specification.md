---
id: product-specification
title: Product Specification
tags:
  - alex
  - ip-rating-requirements
  - jonah
  - meshsync
  - mira
  - product-spec
  - wiki
last_updated: "2026-09-02T06:41:36.288641+00:00"
sidebar_label: Product Specification
slug: /product-specification
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Specification

## Overview
The Product Specification outlines core [hardware](./hardware.md) requirements, [firmware](./firmware.md) stability metrics, and operational parameters for [Aurora Labs](./aurora-labs.md)' hardware and [MeshSync Protocol](./meshsync-protocol.md). Recent updates from team syncs highlight ongoing testing phases, including beta hardware readiness, node stability, and component specifications.

## Key Details
- **MeshSync Performance:** MeshSync is stable at 8 nodes, though reconnecting nodes experience a power spike up to 110 µA.
- **Enclosure & IP Ratings:** Gasket samples have arrived. An IP54 rating is acceptable for the beta release, but achieving an IP65 rating requires a dedicated $8,000 tool as noted in the specifications.
- **Battery Components:** The hardware utilizes CR2032 batteries (correcting previous teardown references to CR2450).

## Related Entities
- **Aurora Labs:** The organization developing the MeshSync protocol and hardware.
- **[Mira](./aurora-nova-widget-v2.md):** Team member managing MeshSync metrics, gasket tooling requirements, and wiki [documentation](./documentation.md) updates.
- **Jonah:** Team member tracking gasket samples, IP rating trade-offs, and specification discrepancies.
- **Alex:** Team member who conducted the hardware teardown.

## Related Concepts
- **MeshSync:** A node-based mesh synchronization protocol currently stabilizing around 8 nodes.
- **IP Rating Requirements:** Environmental sealing standards (IP54 for beta vs. IP65 for production).
- **Hardware Component Specifications:** Detailed bill of materials decisions, such as battery selection (CR2032).

## Contradictions
&gt; **Contradiction:** There is a conflict regarding the default reporting interval for beta testers. The official product specification states a 15-minute default, whereas the [project kickoff](./project-kickoff.md) documentation specified an hourly default interval.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `transcripts/2026-05-28-weekly-sync.md` | text | Medium |

---
id: product-support
title: Product Support
tags:
  - aurora-nova-widget
  - costtooling-tradeoff
  - ip-rating
  - jonah
  - product-support
  - sensenode
  - teabuddy-puck
  - wiki
last_updated: "2026-09-01T19:20:56.573751+00:00"
sidebar_label: Product Support
slug: /product-support
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Support

## Overview
This page documents customer inquiries and agent responses regarding [hardware specifications](./hardware-specifications.md), durability ratings, and product comparisons within product support operations (specifically referencing support ticket #2222 involving the [Aurora Nova Widget](./aurora-nova-widget.md)).

## Key Details
- **Support Ticket:** #2222 (Status: OPEN)
- **Customer:** Gardener located in the Pacific Northwest
- **Product Affected:** Aurora Nova Widget
- **Incident:** Unit #3 failed due to rain after being installed in a raised garden bed, while a neighboring [SenseNode SN-400](./sensenode-sn-400.md) unit remained operational.
- **Support Agent:** Jonah (internal agent)

### Technical Specifications & Product Clarifications
- **Aurora Nova Widget:** Features an IP54 rating (not IP67), making it susceptible to heavy moisture without additional protection. The support recommendation advises using a physical cover, and a comparison page update is scheduled for sprint 15. The roadmap includes an upgrade to IP65.
- **Design Rationale:** The lower waterproof rating on the Aurora Nova Widget is the result of a cost/tooling tradeoff, with beta development focus prioritized on local mesh capabilities and open data export.
- **SenseNode:** Features a higher IP rating (IP67) compared to the Aurora Nova Widget.
- **[TeaBuddy](./teabuddy.md) Puck:** Designed for kitchen use as a splash-resistant device, representing a completely different product line.

## Related Entities
- Aurora Nova Widget
- SenseNode (including competitor model SN-400)
- TeaBuddy puck
- Jonah (Support Agent)
- Support Ticket #1042

## Related Concepts
- IP Rating (Ingress Protection: IP54 vs IP65 vs IP67)
- Cost and tooling tradeoffs in [hardware design](./hardware-design.md)
- Local [mesh networking](./mesh-networking.md) and open data export
- Product line differentiation

## Contradictions
*(No contradictions present in the provided source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt` | text | Unverified |

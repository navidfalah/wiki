---
id: waterproofing
title: Waterproofing
tags:
  - aurora-nova-widget
  - costtooling-tradeoff
  - ip-rating
  - jonah
  - sensenode
  - teabuddy-puck
  - waterproofing
  - wiki
last_updated: "2026-09-10T14:41:05.380026+00:00"
sidebar_label: Waterproofing
slug: /waterproofing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Waterproofing

## Overview
Waterproofing standards and ingress protection vary significantly across [hardware](./hardware.md) products, leading to user confusion in outdoor environments. This topic covers the distinct IP ratings, design trade-offs, and competitive comparisons involving devices such as the [Aurora Nova Widget](./aurora-nova-widget.md), [SenseNode](./sensenode.md), and [TeaBuddy puck](./teabuddy.md).

## Key Details
- **Aurora Nova Widget**: Features an **IP54** rating rather than full waterproofing (IP67). When installed in demanding outdoor environments like Pacific Northwest raised garden beds, units are susceptible to rain damage unless additional covers are used.
- **Support & Roadmap**: Internal agent Jonah notes that a comparison page update is slated for sprint 15, and an IP65 rating is currently on the [product roadmap](./product-roadmap.md).
- **Design Trade-Offs**: The decision to use a lower IP rating on the Aurora Nova Widget stems from a deliberate cost and tooling tradeoff, prioritizing beta focus on local mesh and open data export capabilities over extreme weather sealing.

## Related Entities
- **Aurora Nova Widget**: The primary product discussed in support ticket #2222 regarding water ingress issues.
- **SenseNode**: A competing outdoor device (competitor [SN-400](./sensenode.md)) featuring an **IP67** waterproof rating, which successfully survives heavy rain conditions where unprotected lower-rated units fail.
- **TeaBuddy puck**: A separate kitchen-focused product designed only to be splash-resistant rather than fully waterproof.
- **Jonah**: Support agent handling customer inquiries and internal drafting regarding [product specifications](./product-specifications.md).

## Related Concepts
- **IP Rating (Ingress Protection)**: The standardized classification system used to define levels of sealing effectiveness of electrical enclosures against intrusion from foreign bodies and moisture (e.g., comparing IP54, IP65, and IP67).
- **Cost/Tooling Tradeoff**: [Manufacturing](./manufacturing.md) and engineering decisions that balance production expenses and mold tooling investments against target durability and market positioning.

## Contradictions
*(No direct contradictions present in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt` | text | Unverified |

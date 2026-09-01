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
last_updated: "2026-09-01T19:21:55.817281+00:00"
sidebar_label: Waterproofing
slug: /waterproofing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Waterproofing

## Overview
Waterproofing standards and ratings vary significantly across [hardware](./hardware.md) products, leading to user confusion when deployed in outdoor or demanding environments. A notable support ticket (#2222) highlights the distinction between the weather resistance of the [Aurora Nova Widget](./aurora-nova-widget.md) and competing devices like the [SenseNode SN-400](./sensenode-sn-400.md), as well as kitchen-focused products like the [TeaBuddy puck](./teabuddy.md).

## Key Details
- **Aurora Nova Widget Rating:** The Aurora Nova Widget is rated at **IP54**, making it splash-resistant rather than fully waterproof. When installed outdoors in raised beds (such as in the Pacific NW), heavy rain can compromise the device.
- **[Customer Support](./customer-support.md) Guidance:** Internal agent Jonah recommends using a protective cover for outdoor installations. An update to the comparison page addressing these specifications is scheduled for sprint 15.
- **Roadmap:** An upgrade to an **IP65** rating is currently on the product roadmap.
- **Design Tradeoffs:** The decision to forego an IP67 rating (such as that found on the SenseNode) was driven by a cost and tooling tradeoff, prioritizing a beta focus on local mesh capabilities and open data export instead.

## Related Entities
- **Aurora Nova Widget:** The primary product in question, currently featuring an IP54 ingress protection rating.
- **SenseNode:** A competing device (specifically model SN-400) featuring an IP67 rating, which survived outdoor conditions in raised beds where the Aurora Nova Widget failed.
- **TeaBuddy puck:** A kitchen-focused, splash-resistant product entirely distinct from outdoor [sensor hardware](./sensor-hardware.md).
- **Jonah:** The internal support agent managing ticket #2222.

## Related Concepts
- **IP Rating (Ingress Protection):** The standard measurement for a device's sealing effectiveness against intrusion from foreign bodies (tools, dirt) and moisture.
- **Cost/Tooling Tradeoff:** The manufacturing and financial compromise required to achieve higher water-resistance ratings versus focusing development on [firmware](./firmware.md) features like local mesh and open exports.

## Contradictions
*There are no direct contradictions present in the source material.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt` | text | Unverified |

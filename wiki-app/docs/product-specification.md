---
id: product-specification
title: Product Specification
tags:
  - alex
  - ip-rating-requirements
  - jonah
  - meshsync
  - mira
  - product-specification
  - wiki
last_updated: "2026-09-01T19:20:50.384840+00:00"
sidebar_label: Product Specification
slug: /product-specification
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Product Specification

## Overview
This wiki page synthesizes details regarding the [Aurora Labs](./aurora-labs.md) [product specifications](./product-specifications.md), focusing on [hardware](./hardware.md) components, [firmware](./firmware.md) stability, and IP rating requirements for the beta release.

## Key Details
* **MeshSync Stability:** MeshSync is currently stable at 8 nodes, though a spike to 110 µA occurs when a node rejoins the network.
* **IP Rating Requirements:** Gasket samples have arrived. An IP54 rating is acceptable for the beta phase, while achieving an IP65 rating requires the $8,000 tool specified by [Mira](./aurora-labs.md).
* **Battery Component:** The correct battery used in the device is the CR2032 (correcting an error from Alex's teardown which incorrectly noted a CR2450).

## Related Entities
* **Aurora Labs**
* **MeshSync**
* **Mira**
* **Jonah**
* **Alex**

## Related Concepts
* **IP Ratings** (IP54 vs. IP65)
* **[Power Consumption](./power-consumption.md)** (110 µA rejoin spikes)
* **Hardware Components** (CR2032 battery, gasket samples, tooling)

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the telemetry/reporting default intervals promised to beta testers. The product specification states a 15-minute default, whereas the kickoff meeting stated an hourly default.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `transcripts/2026-05-28-weekly-sync.md` | text | Medium |

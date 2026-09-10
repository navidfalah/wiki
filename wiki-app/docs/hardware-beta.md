---
id: hardware-beta
title: Hardware Beta
tags:
  - alex
  - aurora-labs
  - battery-specification
  - hardware-beta
  - ip-rating-selection
  - jonah
  - meshsync
  - mira
last_updated: "2026-09-10T14:38:19.449114+00:00"
sidebar_label: Hardware Beta
slug: /hardware-beta
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Beta

## Overview
The [Hardware](./hardware.md) Beta project at [Aurora Labs](./aurora-labs.md) involves tracking the stability of [MeshSync](./meshsync.md), evaluating environmental sealing options (IP ratings), clarifying [testing](./testing.md) [documentation](./documentation.md), and verifying component specifications such as battery types.

## Key Details
* **MeshSync Stability:** MeshSync is currently stable at 8 nodes, though a current spike to 110 µA occurs when a node rejoins the network.
* **IP Rating Selection:** Gasket samples have arrived. IP54 has been determined to be sufficient for the beta phase, whereas upgrading to IP65 would require an $8,000 tooling investment as specified by [Mira](./aurora-nova-widget-v2.md).
* **Battery Specification:** The correct battery used in the hardware is the CR2032 (contrary to an incorrect teardown mention of a CR2450).

## Related Entities
* **Aurora Labs:** The organization conducting the weekly sync and [hardware development](./hardware-development.md).
* **Mira:** Team member overseeing MeshSync, IP rating specifications, and documentation checks.
* **Jonah:** Team member managing hardware samples (gaskets) and tooling constraints.
* **Alex:** Team member who performed the teardown.

## Related Concepts
* **MeshSync:** Node-based synchronization protocol currently stable at 8 nodes with a rejoin power spike of 110 µA.
* **IP Ratings:** Environmental protection standards, comparing IP54 (beta-sufficient) against IP65 ($8k tooling required).
* **Teardown Analysis:** Physical component evaluation used to verify parts like battery cells.

## Contradictions
&gt; **Contradiction:** There is a discrepancy regarding the default logging interval for beta testers. The project specification states a 15-minute default, whereas the kickoff notes stated an hourly default.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `transcripts/2026-05-28-weekly-sync.md` | text | Medium |

---
id: wiki-migration
title: Wiki Migration
tags:
  - battery-specifications
  - default-read-interval
  - meshsync
  - nova-widget
  - sam-rivera
  - sensenode
  - teabuddy
  - wiki
last_updated: "2026-09-01T19:22:06.562415+00:00"
sidebar_label: Wiki Migration
slug: /wiki-migration
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Wiki Migration

## Overview

This page documents notes recovered and synthesized from a flawed Notion markdown export dated 2026-06-17 during a wiki migration attempt. It captures technical details regarding the [Nova Widget](./nova-widget.md), [TeaBuddy](./teabuddy.md), and [SenseNode](./sensenode-sn-400.md) [hardware](./hardware.md).

## Key Details

### Nova Widget Specifications
- **Mesh Protocol:** Uses MeshSync.
- **Default Read Interval:** 15 minutes.
- **Battery Type:** Uses CR2032.
- **[Power Consumption](./power-consumption.md):**
  - Sleep mode: 4.2 µA
  - Transmit (TX): 12 mA

### SenseNode
- **Enclosure:** IP67 rated for improved waterproof performance.

### TeaBuddy
- **Connectivity:** Uses [BLE](./ble.md) ([Bluetooth Low Energy](./bluetooth-low-energy.md)) rather than a mesh network.

## Related Entities

- **Nova Widget**
- **TeaBuddy**
- **SenseNode**
- **MeshSync**
- **Sam Rivera**

## Related Concepts

- **[Battery Specifications](./battery-specifications.md)**
- **Default Read Intervals**
- **Mesh [Protocols](./protocols.md) vs. BLE**
- **Hardware Enclosures (IP67)**

## Contradictions

&gt; **Contradiction:** There is a discrepancy regarding the Nova Widget's default read interval; current notes state 15 minutes, but kickoff [documentation](./documentation.md) previously indicated it was hourly.

&gt; **Contradiction:** Documentation conflicts regarding the battery type for the Nova Widget, with some older documentation incorrectly specifying a CR2450 battery instead of the correct CR2032 cell.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md` | text | Unverified |

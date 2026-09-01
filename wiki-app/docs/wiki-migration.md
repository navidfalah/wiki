---
id: wiki-migration
title: Wiki Migration
tags:
  - wiki migration
  - notion export
  - markdown export
  - codebase merging
  - meshsync
  - ble
  - nova widget
  - teabuddy
last_updated: "2026-06-25T08:05:42.455669+00:00"
sidebar_label: Wiki Migration
slug: /wiki-migration
---

# Wiki Migration

## Overview

This page documents issues encountered during a [Wiki Migration](./wiki-migration.md) attempt, specifically focusing on problems arising from a [Notion Export](./notion-export.md) to Markdown Export. The migration revealed several formatting inconsistencies, data contradictions, and structural errors within the exported content, impacting various product notes such as those for the [Nova Widget](./nova-widget.md) and [TeaBuddy](./teabuddy.md).

## Key Details

### Notion Export Issues

The migration attempt highlighted significant flaws in the Markdown Export process from [Notion Export](./notion-export.md), leading to broken formatting and incomplete content:

*   **Markdown Formatting Errors**:
    *   Unclosed bold tags (e.g., `**this line never ends`).
    *   Missing closing pipes in Markdown tables, causing rendering issues.
    *   Incomplete code blocks (e.g., `def broken_fence(` with missing closing elements).
*   **Raw HTML Inclusion**: The export included raw HTML tags (e.g., `<div class="notion-block">`) directly in the Markdown, indicating a failure to properly convert or strip non-Markdown elements.
*   **Broken Links**: Links to invalid or non-existent URLs were present (e.g., `https://example.invalid/404`).

### Nova Widget Notes

Information extracted for the [Nova Widget](./nova-widget.md) during the migration process:

*   **Protocol**: Utilizes [MeshSync](./meshsync.md) as its mesh protocol.
*   **Default Read Interval**: The current default read interval is 15 minutes.
*   **Battery**: The device uses a CR2032 battery.
*   **Battery Consumption**:
    *   Sleep: 4.2 µA
    *   TX: 12 mA

### TeaBuddy Cross-Reference

*   **Protocol**: [TeaBuddy](./teabuddy.md) uses Bluetooth Low Energy (BLE), not a mesh protocol.
*   **Codebase Merging**: Sam Rivera has advised against merging the [TeaBuddy](./teabuddy.md) and [Nova Widget](./nova-widget.md) codebases.

### SenseNode

*   **Waterproofing**: [SenseNode](./sensenode.md) features IP67 waterproofing, indicating a higher level of water resistance.

## Related Entities

*   **Nova Widget**: A device using [MeshSync](./meshsync.md), with specific battery and read interval details.
*   **TeaBuddy**: A device using BLE, distinct from mesh protocols.
*   **SenseNode**: A device noted for its IP67 waterproofing.

## Related Concepts

*   **Notion Export**: The source platform for the wiki content, identified as problematic for Markdown Export conversion.
*   **Markdown Export**: The process of converting content into Markdown format, which failed to preserve integrity.
*   **MeshSync**: A mesh networking protocol used by [Nova Widget](./nova-widget.md).
*   **Bluetooth Low Energy (BLE)**: A wireless communication technology used by [TeaBuddy](./teabuddy.md).
*   **Codebase Merging**: The process of combining different software codebases, advised against for [TeaBuddy](./teabuddy.md) and [Nova Widget](./nova-widget.md).
*   **CR2032 / CR2450**: Common coin cell battery types.
*   CR2032 / CR2450
*   **IP67**: An Ingress Protection rating indicating dust-tightness and resistance to immersion in water up to 1 meter for 30 minutes.

## Contradictions

*   **Nova Widget Read Interval**:
    *   The current documentation states a default read interval of 15 minutes.
    *   **Contradiction:** Earlier kickoff notes suggested an hourly interval.
*   **Nova Widget Battery Type**:
    *   The device uses a CR2032 battery.
    *   **Contradiction:** Some documentation incorrectly states CR2450. The CR2032 is confirmed as correct.

## Sources

*   `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md`

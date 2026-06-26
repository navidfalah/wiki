---
id: notion-export
title: Notion Export
tags:
  - ble-bluetooth-low-energy
  - codebase-merging
  - cr2032
  - cr2450
  - ip67
  - markdown-export-issues
  - meshsync
  - notion-export
last_updated: "2026-06-25T07:44:12.342711+00:00"
sidebar_label: Notion Export
slug: /notion-export
---

```markdown
# Notion Export

## Overview

This page details issues encountered during a wiki migration attempt, specifically highlighting problems with Notion's [Markdown Export](./Markdown_Export.md) functionality. The export process resulted in broken Markdown, including unclosed formatting, missing elements, and embedded HTML, making direct migration challenging. The source material also contained notes on various devices and protocols, some with conflicting information.

## Key Details

### Markdown Export Issues

The Notion export produced several common Markdown formatting errors, indicating a lack of robust conversion:

*   **Unclosed Formatting:** Instances of unclosed bold tags (`**this line never ends`) and incomplete code blocks (`def broken_fence(# missing close`) were present.
*   **Missing Elements:** A table was found with a missing closing pipe (`| Field | Value | |-------|-------| | Sleep | 4.2 µA | TX | 12 mA`).
*   **Embedded HTML:** Raw HTML tags, such as `<div class="notion-block">`, were exported directly into the Markdown.
*   **Broken Links:** Links pointing to invalid or non-existent URLs (`[link to nowhere](https://example.invalid/404)`) were included.

### Nova Widget Notes

*   **Protocol:** The [Nova Widget](./Nova_Widget.md) utilizes [MeshSync](./MeshSync.md) as its mesh protocol.
*   **Battery:** The device uses a [CR2032](./CR2032.md) battery.
*   **Power Consumption:**
    *   Sleep mode: 4.2 µA
    *   Transmit (TX) mode: 12 mA

### TeaBuddy Cross-reference

*   **Protocol:** [TeaBuddy](./TeaBuddy.md) uses [Bluetooth Low Energy](./Bluetooth_Low_Energy.md) (BLE), not a mesh protocol.
*   **Codebase Merging:** [Sam Rivera](./Sam_Rivera.md) advises against merging the TeaBuddy and Nova Widget [Codebase Merging](./Codebase_Merging.md) codebases.

### SenseNode

*   **Waterproofing:** The [SenseNode](./SenseNode.md) device boasts an [IP67](./IP67.md) waterproof rating.

## Related Entities

*   **Nova Widget:** A device using MeshSync and a CR2032 battery.
*   **TeaBuddy:** A device using BLE.
*   **SenseNode:** A device with IP67 waterproofing.
*   **Sam Rivera:** An individual who advised against codebase merging.

## Related Concepts

*   **Markdown Export:** The process of converting content into Markdown format.
*   **MeshSync:** A mesh networking protocol.
*   **Bluetooth Low Energy (BLE):** A wireless personal area network technology.
*   **Codebase Merging:** The process of combining different software codebases.
*   **CR2032:** A common type of lithium coin cell battery.
*   **CR2450:** Another type of lithium coin cell battery, larger than [CR2450](./CR2450.md).
*   **IP67:** An Ingress Protection rating indicating dust-tightness and protection against temporary immersion in water.

## Contradictions

*   **Nova Widget Read Interval:**
    *   **Contradiction:** The default read interval is stated as 15 minutes, but there's a note questioning if it was "hourly in kickoff".
*   **Nova Widget Battery Type:**
    *   **Contradiction:** The device is confirmed to use CR2032, but some documentation incorrectly states CR2450.

## Sources

*   `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md`
```

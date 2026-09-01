---
id: markdown-export-issues
title: Markdown Export Issues
tags:
  - markdown-export-issues
  - notion-export
  - meshsync
  - ble-bluetooth-low-energy
  - codebase-merging
  - cr2032
  - cr2450
  - ip67
last_updated: "2026-06-25T07:39:21.519663+00:00"
sidebar_label: Markdown Export Issues
slug: /markdown-export-issues
---

```markdown
# Markdown Export Issues

## Overview
This page details various issues encountered during a wiki migration attempt, specifically stemming from a [Notion Export](./notion-export.md). The export resulted in broken Markdown formatting, incomplete structures, and embedded non-Markdown elements, highlighting challenges in data integrity and conversion.

## Key Details

### General Export Problems
The Notion export exhibited several common Markdown and content integrity issues:
*   **Unclosed Formatting**: Instances of unclosed bold tags (`**this line never ends`) and incomplete code blocks (`def broken_fence(...) # missing close`).
*   **Incomplete Tables**: A table was found with a missing closing pipe (`| Field | Value | ... Missing closing pipe above ^^^`).
*   **Random HTML**: Raw HTML elements were embedded directly into the Markdown (`<div class="notion-block">SenseNode IP67 better waterproof</div>`).
*   **Broken Links**: A link pointing to an invalid URL was present (`[link to nowhere](https://example.invalid/404)`).
*   **Comments**: HTML-style comments were preserved (`<!-- was hourly in kickoff?? -->`).

### Specific Content Observations from the Export

#### [Nova Widget](./nova-widget.md)
*   **Protocol**: Utilizes [MeshSync](./meshsync.md) as its mesh protocol.
*   **Read Interval**: The default read interval is 15 minutes.
*   **Battery**: The device uses a CR2032 battery.
    *   Sleep current: 4.2 µA
    *   TX current: 12 mA

#### [TeaBuddy](./teabuddy.md)
*   **Protocol**: Employs BLE (Bluetooth Low Energy), not a mesh protocol.
*   **Codebase Merging**: Sam Rivera advised against merging the TeaBuddy codebase with other projects.

#### [SenseNode](./sensenode.md)
*   **Waterproofing**: Features IP67 waterproofing.

## Related Entities
*   **Nova Widget**: A device whose notes were part of the problematic export.
*   **TeaBuddy**: Another device referenced, using BLE.
*   **SenseNode**: A device mentioned for its waterproofing.
*   **Sam Rivera**: An individual who provided a recommendation regarding codebase merging.

## Related Concepts
*   **MeshSync**: A mesh networking protocol used by Nova Widget.
*   **BLE (Bluetooth Low Energy)**: The wireless communication protocol used by TeaBuddy.
*   **Codebase Merging**: The process of combining different software codebases, specifically advised against for TeaBuddy.
*   **CR2032**: A type of lithium coin cell battery used in Nova Widget.
*   **CR2450**: Another type of lithium coin cell battery, incorrectly cited for Nova Widget in some documentation.
*   **IP67**: An Ingress Protection rating indicating dust-tightness and protection against temporary immersion in water.
*   **Notion Export**: The source of the problematic Markdown content.

## Contradictions
*   **Nova Widget Read Interval**: The default read interval is stated as 15 minutes, with a note questioning if it was previously hourly in kickoff discussions.
*   **Nova Widget Battery Type**: The device uses CR2032, but some documentation incorrectly states CR2450.

## Sources
*   `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md`
```

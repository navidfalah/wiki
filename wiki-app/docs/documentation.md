---
id: documentation
title: Documentation
tags:
  - documentation
  - wiki
  - linter
  - battery-management
  - aurora-labs
  - beta-testing
  - process-improvement
  - contradiction-linter
last_updated: "2026-06-25T07:21:14.592959+00:00"
sidebar_label: Documentation
slug: /documentation
---

# Documentation

## Overview

Documentation is a critical aspect of project development at [Aurora Labs](./aurora-labs.md), encompassing wikis, technical specifications, and public-facing content. Efforts are continuously made to improve accuracy, maintain currency, and streamline the documentation process, though challenges persist with outdated information and consistency across various platforms.

## Key Details

*   **Wiki Management**:
    *   The [wiki compiler's heuristic mode](./wiki-compiler-heuristic-mode.md) is functional, allowing for compilation without an API key and resulting in over 40 pages.
    *   Persistent issues include `index.md` pages frequently being out of date in projects, and the existence of "orphan pages" (pages not linked from anywhere).
    *   Proposed tools include a [wiki linter](./linter.md) to identify orphan pages and a contradiction linter, specifically for battery claims.
    *   A half-baked idea involves a pipeline to compile raw text files into Markdown for [Docusaurus](./docusaurus.md).
*   **Content Accuracy and Consistency**:
    *   A recurring problem is documentation stating an hourly default for a setting, while the specification dictates 15 minutes. This issue has been noted multiple times.
    *   An old battery typo ([CR2450](./cr2450.md)) from [Alex's](./alex.md) blog is still indexed and causing issues.
    *   A power budget spreadsheet needs to be published.
*   **Device-Specific Documentation**:
    *   A suggestion exists for a color-coded LED on devices to indicate a "dying" [battery state](./battery-state.md), which would require clear documentation.
*   **Naming Conventions**:
    *   The proposed rename of "[MeshSync](./meshsync.md)" to "[MeshSink](./meshsink.md)" has been repeatedly rejected.
*   **Partnerships and External Content**:
    *   A partnership with a [community garden network](./community-garden-network.md) has been considered, with a cold email draft potentially existing.
    *   A "[TeaBuddy](./teabuddy.md)" partnership for "smart garden tea" was unanimously rejected, though Alex later sent a pebble-shaped stress ball as a joke gift related to it.
    *   [Beta testers](./beta-testing.md) are being invited from [homelab forums](./homelab-forum.md), with 3 new testers recently added from thread #9102. A homelab forum scrape parser is currently broken on nested quotes.
*   **Other Tools/Concepts**:
    *   A fake competitor name generator for demos has been suggested.
    *   Extended dummy data generation is planned before an upcoming demo.

## Related Entities

*   **[Alex](./alex.md)**: Associated with a blog battery typo ([CR2450](./cr2450.md)) and the [TeaBuddy](./teabuddy.md) joke gift.
*   **[Aurora Labs](./aurora-labs.md)**: The primary organization context for all documentation efforts.
*   **[Mira](./mira.md)**: Fixed a sleep regression and is watching GitHub issues for rejoin regressions.
*   **[Jonah](./jonah.md)**: Won approval for the nova widget enclosure pebble shape.
*   **[Board](./board.md)**: Approved waiting on an [IP65](./ip65.md) gasket vendor quote due to cost ($8k).
*   **[Community Garden Network](./community-garden-network.md)**: A potential partnership target.
*   **[Homelab Forum](./homelab-forum.md)**: Source for [beta testers](./beta-testing.md); parser for it is currently broken.
*   **[TeaBuddy](./teabuddy.md)**: A rejected partnership idea.

## Related Concepts

*   **[Wiki Compiler Heuristic Mode](./wiki-compiler-heuristic-mode.md)**: A tool or feature used to compile wiki pages.
*   **[Linter](./linter.md)**: A tool for checking code or documentation for programmatic and stylistic errors.
*   **[Battery State](./battery-state.md)**: Refers to the condition of a device's battery, including a "dying" state.
*   **[CR2450](./cr2450.md)**: A specific type of coin cell battery, mentioned in a typo.
*   **[MeshSync](./meshsync.md) / [MeshSink](./meshsink.md)**: A component or feature name that underwent a renaming discussion.
*   **[Beta Testing](./beta-testing.md)**: The process of testing software or hardware with real users before general release.
*   **[IP65](./ip65.md)**: An Ingress Protection rating, indicating resistance to dust and water.
*   **[Docusaurus](./docusaurus.md)**: A static site generator often used for documentation.

## Contradictions

*   **Contradiction:** The number of times the "[MeshSync](./meshsync.md) → [MeshSink](./meshsink.md)" rename was rejected is stated as "3x" in one source and "4th time" in another.
*   **Contradiction:** Documentation repeatedly states an hourly default for a setting, while the official specification dictates 15 minutes. This is a persistent internal contradiction within the project's documentation.

## Sources

*   `ideas/backlog-shower-thoughts.txt`
*   `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt`
*   `samples/notes/[SAMPLE]-2026-07-01-aurora-standup.txt`

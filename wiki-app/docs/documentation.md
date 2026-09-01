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
    *   The wiki compiler's heuristic mode is functional, allowing for compilation without an API key and resulting in over 40 pages.
    *   Persistent issues include `index.md` pages frequently being out of date in projects, and the existence of "orphan pages" (pages not linked from anywhere).
    *   Proposed tools include a wiki linter to identify orphan pages and a contradiction linter, specifically for battery claims.
    *   A half-baked idea involves a pipeline to compile raw text files into Markdown for Docusaurus.
*   **Content Accuracy and Consistency**:
    *   A recurring problem is documentation stating an hourly default for a setting, while the specification dictates 15 minutes. This issue has been noted multiple times.
    *   An old battery typo (CR2450) from Alex's blog is still indexed and causing issues.
    *   A power budget spreadsheet needs to be published.
*   **Device-Specific Documentation**:
    *   A suggestion exists for a color-coded LED on devices to indicate a "dying" battery state, which would require clear documentation.
*   **Naming Conventions**:
    *   The proposed rename of "[MeshSync](./meshsync.md)" to "MeshSink" has been repeatedly rejected.
*   **Partnerships and External Content**:
    *   A partnership with a community garden network has been considered, with a cold email draft potentially existing.
    *   A "[TeaBuddy](./teabuddy.md)" partnership for "smart garden tea" was unanimously rejected, though Alex later sent a pebble-shaped stress ball as a joke gift related to it.
    *   [Beta testers](./beta-testing.md) are being invited from homelab forums, with 3 new testers recently added from thread #9102. A homelab forum scrape parser is currently broken on nested quotes.
*   **Other Tools/Concepts**:
    *   A fake competitor name generator for demos has been suggested.
    *   Extended dummy data generation is planned before an upcoming demo.

## Related Entities

*   **Alex**: Associated with a blog battery typo (CR2450) and the [TeaBuddy](./teabuddy.md) joke gift.
*   **[Aurora Labs](./aurora-labs.md)**: The primary organization context for all documentation efforts.
*   **Mira**: Fixed a sleep regression and is watching GitHub issues for rejoin regressions.
*   **Jonah**: Won approval for the nova widget enclosure pebble shape.
*   **Board**: Approved waiting on an IP65 gasket vendor quote due to cost ($8k).
*   **Community Garden Network**: A potential partnership target.
*   **Homelab Forum**: Source for [beta testers](./beta-testing.md); parser for it is currently broken.
*   **[TeaBuddy](./teabuddy.md)**: A rejected partnership idea.

## Related Concepts

*   **Wiki Compiler Heuristic Mode**: A tool or feature used to compile wiki pages.
*   **Linter**: A tool for checking code or documentation for programmatic and stylistic errors.
*   **Battery State**: Refers to the condition of a device's battery, including a "dying" state.
*   **CR2450**: A specific type of coin cell battery, mentioned in a typo.
*   **[MeshSync](./meshsync.md) / MeshSink**: A component or feature name that underwent a renaming discussion.
*   **[Beta Testing](./beta-testing.md)**: The process of testing software or hardware with real users before general release.
*   **IP65**: An Ingress Protection rating, indicating resistance to dust and water.
*   **Docusaurus**: A static site generator often used for documentation.

## Contradictions

*   **Contradiction:** The number of times the "[MeshSync](./meshsync.md) → MeshSink" rename was rejected is stated as "3x" in one source and "4th time" in another.
*   **Contradiction:** Documentation repeatedly states an hourly default for a setting, while the official specification dictates 15 minutes. This is a persistent internal contradiction within the project's documentation.

## Sources

*   `ideas/backlog-shower-thoughts.txt`
*   `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt`
*   `samples/notes/[SAMPLE]-2026-07-01-aurora-standup.txt`

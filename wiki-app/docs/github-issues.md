---
id: github-issues
title: GitHub Issues
tags:
  - aurora-labs
  - beta-release
  - github-issue
  - github-issues
  - meshfan
  - meshsync
  - mira-chen
  - node-cap
last_updated: "2026-06-25T07:24:04.909087+00:00"
sidebar_label: GitHub Issues
slug: /github-issues
---

# GitHub Issues

## Overview

GitHub Issues serve as a platform for tracking bugs, enhancements, and other tasks related to software development projects. This page details a specific GitHub issue, `aurora-labs/meshsync #442`, which highlights persistent "rejoin storm" problems in the Meshsync system, particularly when operating with 8 nodes.

## Key Details

The `aurora-labs/meshsync #442` GitHub issue, titled "Rejoin storm persists at 8 nodes on 0.3.8," is currently open and tagged with `bug`, `power`, and `beta` labels.

*   **Issue Description**: The problem manifests as multi-hour periods of silence after an 8th node is added to a Meshsync network, even with all units flashed to version 0.3.8.
*   **Initial Report**: `@potato99` reported the issue on 2026-07-03, confirming the persistence of the rejoin storm.
*   **Aurora Labs Response**:
    *   `@mira-chen` from Aurora Labs requested RSSI logs to be sent to support for further investigation.
    *   A temporary workaround suggested by `@mira-chen` is to cap the number of nodes at 6 to avoid the issue.
    *   `@mira-chen` also indicated that the 0.3.9 milestone has been moved up, and it will include a "Parent election rewrite" aimed at addressing underlying issues.
*   **Community Feedback**:
    *   `@meshfan` noted that while version 0.3.8 showed some improvement, it did not fully resolve the problem. They also mentioned a "SenseNode user laughing at mesh complexity," implying external perception of the system's stability.
    *   `@teaguy` made a brief, off-topic comment.
*   **Impact**: The issue affects the stability and reliability of Meshsync networks at higher node counts, specifically 8 nodes, leading to significant operational silence.

## Related Entities

*   **Aurora Labs**: The organization responsible for the Meshsync project.
*   **Meshsync**: The software project experiencing the reported bug.
*   **@potato99**: The user who initially reported the persistent rejoin storm issue.
*   **@mira-chen**: An Aurora Labs team member providing support and updates on the issue.
*   **@meshfan**: A community member providing feedback on the issue's status.
*   **SenseNode**: An external entity or product mentioned in relation to mesh complexity.

## Related Concepts

*   **Rejoin Storm**: A network phenomenon where nodes repeatedly disconnect and attempt to rejoin the network, leading to instability and communication failures.
*   **Node Count Limits**: The observation that the Meshsync system experiences issues when exceeding a certain number of nodes (e.g., 8 nodes), with a suggested workaround of capping at 6 nodes.
*   **RSSI Logs**: Received Signal Strength Indicator logs, crucial for diagnosing wireless network performance issues.
*   **Beta Release**: Version 0.3.8 and the upcoming 0.3.9 are part of a beta development phase, indicating ongoing testing and refinement.
*   **Parent Election Rewrite**: A significant architectural change planned for version 0.3.9, aimed at improving network stability and addressing issues like rejoin storms.
*   **Bug**: The classification of the issue as a defect in the software.
*   **Power**: A label associated with the issue, suggesting potential power-related factors contributing to the problem.

## Contradictions

No contradictions were identified in the provided source material.

## Sources

*   `samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt`

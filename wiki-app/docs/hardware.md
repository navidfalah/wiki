---
id: hardware
title: Hardware
tags:
  - alex
  - battery-math-revalidation
  - cr2032
  - cr2450
  - engineering-requirements
  - fifteen-minute-default
  - hardware
  - hardware-habit
last_updated: "2026-06-25T07:26:54.967264+00:00"
sidebar_label: Hardware
slug: /hardware
---

# Hardware

## Overview

This page compiles information regarding hardware specifications, default operational settings, battery requirements, and identified discrepancies in documentation. It highlights the importance of accurate specifications and ongoing validation.

## Key Details

*   **Default Settings**: The hardware specification mandates a "fifteen minute default" for a particular operation.
*   **Engineering Requirements**:
    *   Engineering requires a minimum battery life of eighteen months when operating at ten nodes.
    *   This requirement contrasts with a marketing claim of two years for battery life.
*   **Battery Specifications**:
    *   The correct battery type used in the hardware is CR2032.
    *   A blog post authored by Alex incorrectly stated the battery type as CR2450.
    *   This correction needs to be ingested into the wiki to ensure accurate documentation.
*   **Action Items**:
    *   Revalidate the battery math to confirm specifications.
    *   Reply to a comment related to "Hardware Habit".

## Related Entities

*   **Alex**: Author of a blog post that contained incorrect battery information (CR2450 instead of CR2032).
*   **Marketing**: Department that made a two-year battery life claim, which differs from engineering's eighteen-month minimum requirement.
*   **Engineering**: Department responsible for setting and validating hardware requirements, including the eighteen-month minimum battery life at ten nodes.
*   **Hardware Habit**: A context or platform where a comment requires a reply.

## Related Concepts

*   **Battery Specifications**: Details regarding the type, capacity, and expected lifespan of batteries used in hardware.
*   **Default Settings**: Pre-configured operational parameters for hardware.
*   **Engineering Requirements**: Technical specifications and performance targets set by the engineering team.
*   **Product Documentation**: Materials that describe product features, specifications, and usage, which must be accurate and consistent.
*   **Specification Discrepancies**: Inconsistencies or errors found between different sources of product information (e.g., engineering specs, marketing claims, blog posts).

## Contradictions

*   **Default Operation**:
    &gt; **Contradiction:** The "fifteen minute default" specified in the hardware documentation contrasts with an "hourly kickoff" that was also mentioned.
*   **Battery Life Claims**:
    &gt; **Contradiction:** Marketing's claim of "two years" for battery life differs from Engineering's requirement of "eighteen months minimum at ten nodes."
*   **Battery Type Documentation**:
    &gt; **Contradiction:** Alex's blog incorrectly listed CR2450 as the battery type, while the actual battery used in the hardware is CR2032.

## Sources

*   `transcripts/2026-06-05-sync-fragment.txt`

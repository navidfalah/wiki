---
id: battery-specifications
title: Battery Specifications
tags:
  - cr2032
  - battery life
  - power consumption
  - aurora nova widget
  - documentation
  - specifications
  - battery calculator
  - cr2450
last_updated: "2026-06-25T07:12:58.854122+00:00"
sidebar_label: Battery Specifications
slug: /battery-specifications
---

# Battery Specifications

## Overview

This page details the battery specifications for the [Aurora Nova Widget](./aurora-nova-widget.md), including the correct battery type, expected battery life, and factors influencing power consumption. It also addresses past discrepancies in documentation and provides information on related tools and products.

## Key Details

### Battery Type

*   **Correct Battery**: The [Aurora Nova Widget](./aurora-nova-widget.md) uses a **[CR2032](./cr2032.md)** battery.
*   **Previous Discrepancy**: An earlier blog post by [Alex](./alex.md) incorrectly listed the battery type as [CR2450](./cr2450.md). This error was corrected on the blog by June 20, 2026, and the wiki page was updated accordingly.

### Battery Life Expectancy

*   **Marketing Claim**: Marketing materials state a 2-year battery life.
*   **Engineering Target**: Engineering aims for a minimum of 18 months of battery life, specifically when operating with 10 nodes.
*   **Influencing Factors**: Battery life is significantly affected by:
    *   **[Node Count](./node-count.md)**: The number of connected nodes.
    *   **[Read Interval](./read-interval.md)**: The frequency at which data is read. The default read interval is 15 minutes, as specified in the product documentation.
*   **Documentation**: A comprehensive [Power Budget](./power-budget.md) document is scheduled for publication soon to provide more detailed information on power consumption.
*   **Action Item**: Power numbers are to be revalidated following a rejoin fix.

### Battery Calculator Spreadsheet

*   The battery calculator spreadsheet, developed for the [Aurora Nova Widget](./aurora-nova-widget.md), can be shared with other teams, such as the [TeaBuddy](./teabuddy.md) team, provided proper credit is given.
*   **Note**: The [TeaBuddy](./teabuddy.md) product uses different [Battery Chemistry](./battery-chemistry.md) and has a higher power draw due to [Haptic Draw](./haptic-draw.md), meaning the calculator's direct applicability may vary.

## Related Entities

*   **[Aurora Nova Widget](./aurora-nova-widget.md)**: The primary product for which these battery specifications apply.
*   **[TeaBuddy](./teabuddy.md)**: A different product from a separate company that inquired about sharing the battery calculator spreadsheet.
*   **[Alex](./alex.md)**: Author of a blog post that initially contained incorrect battery information.
*   **[Mira Chen](./mira-chen.md)**: Agent/engineer involved in clarifying battery specifications and documentation.
*   **[Jonah Park](./jonah-park.md)**: Engineer/manager involved in discussions regarding battery life and documentation.

## Related Concepts

*   **[Power Budget](./power-budget.md)**: Detailed analysis of power consumption for different operational scenarios.
*   **[Node Count](./node-count.md)**: The number of connected devices or sensors that impact overall power draw.
*   **[Read Interval](./read-interval.md)**: The frequency of data collection, directly affecting battery usage.
*   **[Battery Chemistry](./battery-chemistry.md)**: The specific chemical composition of a battery, which influences its performance characteristics.
*   **[Haptic Draw](./haptic-draw.md)**: Power consumption related to haptic feedback mechanisms.
*   **[Documentation Accuracy](./documentation-accuracy.md)**: The importance of consistent and correct information across all product documentation and marketing materials.

## Contradictions

*   **Battery Type**:
    *   **Contradiction:** [Alex](./alex.md)'s teardown blog initially listed [CR2450](./cr2450.md), while the official specification is [CR2032](./cr2032.md). This was resolved with the blog being corrected on June 20, 2026.
*   **Battery Life Expectancy**:
    *   **Contradiction:** Marketing materials claim a 2-year battery life, whereas engineering targets an 18-month minimum at 10 nodes. This indicates a potential difference between ideal marketing claims and conservative engineering estimates under specific load conditions.
*   **Default Read Interval**:
    *   **Contradiction:** The product specification states a 15-minute default read interval, but earlier kickoff slides mentioned an hourly interval. The 15-minute interval is the current correct default.

## Sources

*   `samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt`
*   `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt`

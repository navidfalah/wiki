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

*   **Correct Battery**: The [Aurora Nova Widget](./aurora-nova-widget.md) uses a **CR2032** battery.
*   **Previous Discrepancy**: An earlier blog post by Alex incorrectly listed the battery type as CR2450. This error was corrected on the blog by June 20, 2026, and the wiki page was updated accordingly.

### Battery Life Expectancy

*   **Marketing Claim**: Marketing materials state a 2-year battery life.
*   **Engineering Target**: Engineering aims for a minimum of 18 months of battery life, specifically when operating with 10 nodes.
*   **Influencing Factors**: Battery life is significantly affected by:
    *   **Node Count**: The number of connected nodes.
    *   **Read Interval**: The frequency at which data is read. The default read interval is 15 minutes, as specified in the product documentation.
*   **Documentation**: A comprehensive Power Budget document is scheduled for publication soon to provide more detailed information on power consumption.
*   **Action Item**: Power numbers are to be revalidated following a rejoin fix.

### Battery Calculator Spreadsheet

*   The battery calculator spreadsheet, developed for the [Aurora Nova Widget](./aurora-nova-widget.md), can be shared with other teams, such as the [TeaBuddy](./teabuddy.md) team, provided proper credit is given.
*   **Note**: The [TeaBuddy](./teabuddy.md) product uses different Battery Chemistry and has a higher power draw due to Haptic Draw, meaning the calculator's direct applicability may vary.

## Related Entities

*   **[Aurora Nova Widget](./aurora-nova-widget.md)**: The primary product for which these battery specifications apply.
*   **[TeaBuddy](./teabuddy.md)**: A different product from a separate company that inquired about sharing the battery calculator spreadsheet.
*   **Alex**: Author of a blog post that initially contained incorrect battery information.
*   **Mira Chen**: Agent/engineer involved in clarifying battery specifications and documentation.
*   **Jonah Park**: Engineer/manager involved in discussions regarding battery life and documentation.

## Related Concepts

*   **Power Budget**: Detailed analysis of power consumption for different operational scenarios.
*   **Node Count**: The number of connected devices or sensors that impact overall power draw.
*   **Read Interval**: The frequency of data collection, directly affecting battery usage.
*   **Battery Chemistry**: The specific chemical composition of a battery, which influences its performance characteristics.
*   **Haptic Draw**: Power consumption related to haptic feedback mechanisms.
*   **Documentation Accuracy**: The importance of consistent and correct information across all product documentation and marketing materials.

## Contradictions

*   **Battery Type**:
    *   **Contradiction:** Alex's teardown blog initially listed CR2450, while the official specification is CR2032. This was resolved with the blog being corrected on June 20, 2026.
*   **Battery Life Expectancy**:
    *   **Contradiction:** Marketing materials claim a 2-year battery life, whereas engineering targets an 18-month minimum at 10 nodes. This indicates a potential difference between ideal marketing claims and conservative engineering estimates under specific load conditions.
*   **Default Read Interval**:
    *   **Contradiction:** The product specification states a 15-minute default read interval, but earlier kickoff slides mentioned an hourly interval. The 15-minute interval is the current correct default.

## Sources

*   `samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt`
*   `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt`

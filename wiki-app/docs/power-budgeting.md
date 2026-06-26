---
id: power-budgeting
title: Power Budgeting
tags:
  - aurora-nova-widget
  - cr2032
  - engineering-claim
  - mah-milliampere-hour
  - marketing-slide
  - mesh-size
  - meshsync
  - mira-chen
  - battery-life
  - power-consumption
last_updated: "2026-06-25T07:45:47.170406+00:00"
sidebar_label: Power Budgeting
slug: /power-budgeting
---

# Power Budgeting

## Overview

Power budgeting is a critical process in the design and development of battery-powered electronic devices. It involves estimating the [Power Consumption](./power-consumption.md) of a device across its various operational states and using this data to predict [Battery Life](./battery-life.md). Accurate power budgeting ensures that devices meet their intended operational lifespan and helps identify potential power inefficiencies.

## Key Details

The [Aurora Nova Widget](./aurora-nova-widget.md) serves as a primary example for detailed power budgeting analysis, with specific assumptions and calculations leading to an engineering claim for battery life.

### Aurora Nova Widget Power Budget

**Assumptions:**

*   **Battery:** [CR2032](./cr2032.md) cell, with a nominal capacity of 220 [mAh](./mah.md) (accounting for datasheet variance, not 240 mAh).
*   **Read Interval:** 15 minutes (authoritative specification).
*   **Mesh Size:** 10 nodes (considered a stress case for network activity).

**Daily Power Consumption Breakdown:**

| State         | Current           | Duty Cycle | Daily mAh |
| :------------ | :---------------- | :--------- | :-------- |
| Sleep         | 4.2 µA            | 99.7%      | 0.10      |
| Sample + TX   | 12 mA             | 0.03%      | 0.05      |
| Rejoin Spike  | 180 µA (average)  | 0.01%      | 0.04      |

**Total Daily Consumption:** Approximately 0.19 mAh/day.

**Engineering Claim:** Based on these calculations, the Aurora Nova Widget is projected to have a battery life of approximately 18 months.

### Comparison with TeaBuddy Puck

A comparison with the [TeaBuddy Puck](./teabuddy-puck.md) (based on Sam's numbers) indicates a daily consumption of approximately 0.35 mAh/day when used for 5 steeps. This consumption rate suggests a 12-month battery life target for the TeaBuddy puck is plausible.

## Related Entities

*   **[Aurora Nova Widget](./aurora-nova-widget.md):** The primary device for which the power budget was calculated.
*   **[CR2032](./cr2032.md):** A common coin cell battery type used in the Aurora Nova Widget.
*   **[MeshSync](./meshsync.md):** Likely a component or protocol related to the mesh network functionality of the widget, impacting power consumption.
*   **[TeaBuddy Puck](./teabuddy-puck.md):** Another device used for comparative power consumption analysis.
*   **[Mira Chen](./mira-chen.md):** Author of the power budget working notes.

## Related Concepts

*   **[mAh](./mah.md) (Milliampere-hour):** A unit of electric charge, commonly used to express the energy capacity of batteries.
*   **[Battery Life](./battery-life.md):** The duration for which a battery can power a device under specified conditions.
*   **[Power Consumption](./power-consumption.md):** The rate at which electrical energy is used by a device.
*   **[Duty Cycle](./duty-cycle.md):** The proportion of time during which a component, device, or system is in an active state.
*   **[Mesh Network](./mesh-network.md):** A network topology where each node relays data for the network, contributing to potential "Rejoin spike" power events.

## Contradictions

**Contradiction:** While engineering calculations project an 18-month battery life for the Aurora Nova Widget, a marketing slide claims "2 years." This discrepancy arises from different underlying assumptions: the marketing slide assumes a smaller mesh size (6 nodes), an optimistic battery cell, and an incorrect, less frequent hourly read interval, whereas the engineering budget uses a 15-minute read interval and a 10-node mesh size.

## Sources

*   `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt`

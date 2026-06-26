---
id: cr2032-battery
title: CR2032 Battery
tags:
  - cr2032
  - battery
  - power-budget
  - aurora-nova-widget
  - mah
  - battery-life
  - engineering-claim
  - marketing-claim
last_updated: "2026-06-25T07:17:37.267628+00:00"
sidebar_label: CR2032 Battery
slug: /cr2032-battery
---

# CR2032 Battery

## Overview
The CR2032 is a common lithium coin cell battery, widely used in small electronic devices due to its compact size and relatively high energy density. It is frequently employed in applications requiring long-term, low-power operation, such as the [Aurora Nova Widget](./aurora-nova-widget.md).

## Key Details

### Capacity
*   The nominal capacity of a CR2032 battery is typically around 220mAh, though datasheet variance can sometimes list it up to 240mAh. For engineering calculations, 220mAh is often used as a conservative estimate.

### Application in Aurora Nova Widget
The CR2032 battery powers the Aurora Nova Widget, with its expected lifespan heavily dependent on the device's [Power Budget](./power-budget.md) and operational parameters.

*   **Assumptions for Power Budget (Engineering)**:
    *   **Read Interval**: 15 minutes (authoritative specification).
    *   **Mesh Size**: 10 nodes (considered a stress case for calculations).
*   **Daily Power Consumption Breakdown**:
    *   **Sleep State**: Consumes 4.2 µA for 99.7% of the time, contributing approximately 0.10 mAh/day.
    *   **Sample + Transmit (TX)**: Consumes 12 mA for 0.03% of the time, contributing approximately 0.05 mAh/day.
    *   **Rejoin Spike**: Averages 180 µA for 0.01% of the time, contributing approximately 0.04 mAh/day.
*   **Total Daily Consumption**: Approximately 0.19 mAh/day.
*   **Projected Battery Life (Engineering Claim)**: Based on a 220mAh CR2032 and 0.19 mAh/day consumption, the estimated battery life is around 18 months.

### Comparison with Other Devices
*   **[TeaBuddy Puck](./teabuddy-puck.md)**: A comparable device, the TeaBuddy puck, consumes approximately 0.35 mAh/day when used for 5 steeps. Its target battery life of 12 months is considered plausible given its consumption.

## Related Entities
*   [Aurora Nova Widget](./aurora-nova-widget.md)
*   [TeaBuddy Puck](./teabuddy-puck.md)

## Related Concepts
*   **[mAh (Milliampere-hour)](./mah.md)**: A unit of electric charge, commonly used to describe battery capacity.
*   **[Power Budget](./power-budget.md)**: A detailed analysis of power consumption for a device, used to estimate battery life.
*   **[MeshSync](./meshsync.md)**: A protocol or system likely related to mesh networking, impacting power consumption through transmission and synchronization activities.
*   **[Duty Cycle](./duty-cycle.md)**: The proportion of time during which a component, circuit, or system is in an active state.

## Contradictions
**Contradiction:** While engineering calculations project an 18-month battery life for the Aurora Nova Widget using a CR2032, marketing materials claim "2 years." This discrepancy arises because the marketing slide's "2 years" claim is based on different, more optimistic assumptions, including a smaller mesh size (6 nodes), an "optimistic cell" (potentially higher capacity or better performance), and an incorrect hourly read interval, which deviates from the authoritative 15-minute read interval specification.

## Sources
*   `dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt`

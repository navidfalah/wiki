---
id: meshsync-firmware
title: MeshSync Firmware
tags:
  - aurora-labs
  - default-read-interval
  - jonah-park
  - known-issues
  - meshsync
  - meshsync-firmware
  - mira-chen
  - mqtt-export-schema-v2
last_updated: "2026-06-25T07:41:16.960337+00:00"
sidebar_label: MeshSync Firmware
slug: /meshsync-firmware
---

# MeshSync Firmware

## Overview

MeshSync Firmware is a core component developed by Aurora Labs, designed to manage and optimize mesh network operations, particularly for devices like the Nova Widget. The firmware focuses on improving network stability, power efficiency, and data export capabilities. This page details the 0.3.8 release, highlighting its features, breaking changes, and known issues.

## Key Details

### Release 0.3.8 Information

*   **Release Date**: 2026-07-02
*   **Owners**:
    *   Mira Chen (Firmware Lead)
    *   Jonah Park (QA Sign-off)
*   **Context**: This release is part of the fictional Aurora Labs product line, specifically impacting MeshSync and Nova Widget devices.

### Key Enhancements

*   **Rejoin Storm Mitigation**: Implemented to address instability when a mesh network exceeds 6 nodes, a known issue since the beta phase.
*   **Parent Election Logging**: Enhanced logging capabilities now export RSSI (Received Signal Strength Indicator) and hop count data via debug UART, providing better insights into network topology and health.
*   **Power Spike Reduction**: The power spike observed during device rejoin events has been significantly reduced from 340µA to 180µA. While an improvement, it is still above the target of 110µA.

### Breaking Changes

*   **Default Read Interval**: The default read interval remains **15 minutes**. This contradicts earlier information from kickoff slides which incorrectly stated it would be hourly.
*   **MQTT Export Schema v2**: An optional new schema for MQTT data export has been introduced. This version is currently supported for local brokers only.

### Known Issues

*   **Network Instability (8+ Nodes)**: Field reports indicate that networks with 8 or more nodes continue to experience instability (tracked under ticket #2099).
*   **Battery Life Discrepancy**: Engineering estimates battery life at 18 months for a 10-node setup, while marketing materials may still claim 2 years.

### Out-of-Scope Features

*   **Tea Timer Syncing**: A request from Sam Rivera to integrate tea timer synchronization with MeshSync was deemed out of scope for Aurora v1.

## Related Entities

*   **Aurora Labs**: The fictional company developing MeshSync Firmware.
*   **Mira Chen**: Firmware owner for the 0.3.8 release.
*   **Jonah Park**: QA sign-off owner for the 0.3.8 release.
*   **Sam Rivera**: Individual who inquired about tea timer syncing functionality.

## Related Concepts

*   **MeshSync**: The overarching technology or product line that the firmware supports.
*   **Nova Widget**: A device likely utilizing MeshSync Firmware.
*   **MQTT**: A lightweight messaging protocol used for data export.
*   **Rejoin Storm**: A network event where multiple nodes attempt to rejoin the mesh simultaneously, potentially causing instability.
*   **RSSI (Received Signal Strength Indicator)**: A measurement of the power present in a received radio signal.
*   **Hop Count**: The number of intermediate devices (hops) a data packet travels from its source to its destination in a network.

## Contradictions

*   **Default Read Interval**:
    &gt; **Contradiction:** The default read interval for MeshSync Firmware 0.3.8 is 15 minutes, directly contradicting earlier "kickoff slides" which incorrectly stated it would be hourly.
*   **Battery Life Estimates**:
    &gt; **Contradiction:** Engineering estimates for battery life are 18 months for a 10-node configuration, while marketing materials may still advertise a longer duration of 2 years.

## Sources

*   `dummy-test/2026-07-02-aurora-meshsync-release-notes.md`

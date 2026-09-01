---
id: release-notes
title: Release Notes
tags:
  - aurora-labs
  - default-read-interval
  - jonah-park
  - known-issues
  - meshsync
  - mira-chen
  - mqtt-export-schema-v2
  - nova-widget
last_updated: "2026-06-25T07:54:43.216776+00:00"
sidebar_label: Release Notes
slug: /release-notes
---

# Release Notes

This page details the release notes for [MeshSync](./meshsync.md) [firmware](./firmware.md) version 0.3.8, a fictional release from [Aurora Labs](./aurora-labs.md). These notes highlight key updates, breaking changes, and [known issues](./known-issues.md) associated with this firmware version.

## Overview

MeshSync firmware 0.3.8, released by Aurora Labs, focuses on improving mesh network stability and power efficiency, particularly for larger node counts. It introduces enhancements like rejoin storm mitigation and improved logging, alongside a new [MQTT](./mqtt.md) export schema. The release also clarifies the default read interval and lists ongoing known issues.

## Key Details

### Release Information

*   **Product:** MeshSync firmware
*   **Version:** 0.3.8
*   **Release Date:** 2026-07-02
*   **Owners:**
    *   Mira Chen (firmware)
    *   Jonah Park (QA sign-off)
*   **Label:** Fictional Aurora Labs release, also associated with the [Nova Widget](./nova-widget.md).

### Highlights

*   **Rejoin Storm Mitigation:** Implemented to address instability when a mesh network exceeds 6 nodes, a known issue since the beta phase.
*   **Parent Election Logging:** Enhanced to export RSSI (Received Signal Strength Indicator) and hop count data via debug UART, providing better insights into network topology.
*   **Power Spike Reduction:** The power spike observed during node rejoin events has been reduced from 340µA to 180µA. The engineering target for this spike remains 110µA.

### Breaking Changes

*   **Default Read Interval:** The default read interval remains **15 minutes**. This clarifies previous misinformation, as kickoff slides had incorrectly stated it would be hourly.
*   **MQTT Export Schema v2:** A new MQTT export schema (version 2) has been introduced. This is an optional feature and is intended for use with local brokers only.

### Known Issues

*   **Network Instability (8+ Nodes):** Field reports indicate that mesh networks with 8 or more nodes continue to experience instability. This issue is being tracked under ticket #2099.
*   **Battery Life Discrepancy:** Engineering estimates [battery life](./battery-life.md) at 18 months for a 10-node setup, while marketing materials may still claim a 2-year battery life.

### Out of Scope

*   **TeaBuddy Integration:** A request from Sam Rivera regarding MeshSync's ability to synchronize tea timers has been deemed out of scope for Aurora v1.

## Related Entities

*   **Aurora Labs:** The developer and owner of MeshSync firmware.
*   **Mira Chen:** Firmware owner for MeshSync 0.3.8.
*   **Jonah Park:** Provided QA sign-off for MeshSync 0.3.8.
*   **Sam Rivera:** Inquired about TeaBuddy integration with MeshSync.
*   **Nova Widget:** A product or component associated with MeshSync.

## Related Concepts

*   **MeshSync:** The firmware product being updated.
*   **Firmware:** Software embedded in hardware devices.
*   **Rejoin Storm:** A network event where multiple nodes attempt to rejoin a mesh simultaneously, potentially causing instability.
*   **Parent Election:** The process by which nodes select their parent in a mesh network.
*   **RSSI (Received Signal Strength Indicator):** A measurement of the power present in a received radio signal.
*   **Hop Count:** The number of intermediate devices through which data passes from source to destination.
*   **MQTT (Message Queuing Telemetry Transport):** A lightweight messaging protocol for small sensors and mobile devices.
*   **Battery Life:** The duration a device can operate on its battery.
*   **Known Issues:** Documented problems or bugs in a software or hardware release.
*   **Breaking Changes:** Modifications that may require users to update their code or configuration.

## Contradictions

*   **Default Read Interval:** The release notes explicitly state that the default read interval remains 15 minutes, correcting previous "kickoff slides" that incorrectly indicated an hourly interval. This highlights a discrepancy between internal documentation/communication and the final product specification.
*   **Battery Life Estimates:** There is a noted difference between engineering's battery life estimate (18 months for 10 nodes) and what marketing materials "may still say" (2 years). This represents a potential contradiction in communicated product specifications.

## Sources

*   `dummy-test/2026-07-02-aurora-meshsync-release-notes.md`

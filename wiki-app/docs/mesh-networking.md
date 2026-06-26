---
id: mesh-networking
title: Mesh Networking
tags:
  - mesh-networking
  - meshsync
  - aurora-nova-widget
  - iot-sensors
  - battery-life
  - scalability
  - open-source
  - known-issues
last_updated: "2026-06-25T07:41:05.969409+00:00"
sidebar_label: Mesh Networking
slug: /mesh-networking
---

```markdown
# Mesh Networking

## Overview

[Mesh Networking](./mesh-networking.md), specifically through the **[MeshSync](./meshsync.md)** protocol, is a core feature of the **[Aurora Nova Widget v2 beta unit](./aurora-nova-widget-v2-beta-unit.md)**. This technology enables local, device-to-device communication, forming a mesh network for [open-source](./open-source.md) soil moisture and temperature sensors. A primary advantage of MeshSync is its ability to operate without a mandatory [Cloud Subscription](./cloud-subscription.md), offering a decentralized approach to [IoT Sensors](./iot-sensors.md) data collection. However, this approach introduces inherent **[complexity at scale](./complexity-at-scale.md)** compared to simpler, potentially subscription-based network topologies.

## Key Details

### MeshSync Protocol
*   **Application:** Implemented in the Aurora Nova Widget v2 beta unit.
*   **Theoretical Capacity:** Supports a maximum of 32 nodes.
*   **Current Stability:**
    *   Stable at 6 nodes in laboratory environments.
    *   Beta tested to 8 nodes, where it exhibits instability.
*   **Parent Election:** The mechanism for parent election within the mesh is currently undefined or unclear.
*   **Development Notes:** The name "MeshSync" has been consistently preferred over "MeshSink" despite multiple suggestions for renaming.

### Aurora Nova Widget v2 Beta Unit
*   **Product Type:** An open-source soil moisture and temperature sensor.
*   **Key Personnel:** [Mira Chen](./mira-chen.md) (firmware owner) and [Jonah Park](./jonah-park.md) (hardware owner).
*   **Sampling Interval:** The product specification dictates a 15-minute sampling interval, though public documentation still incorrectly states an hourly default.
*   **Physical Design:** The enclosure features an approved "pebble shape."

### Power Consumption and Battery Life
*   **Battery:** Powered by a single [CR2032 battery](./cr2032-battery.md).
*   **Power Budget (Target/Peak):**
    *   Sleep Mode: 4.2 µA (target)
    *   Sample + Transmit (TX): 12 mA peak (at 15-minute intervals)
    *   Rejoin Spike: 110–340 µA (identified as a known issue).
*   **Battery Life Estimates:**
    *   Marketing Claim: 2 years.
    *   Engineering Estimate: 18 months when operating with 10 nodes.
*   **Action Items:** An action item exists to implement a "contradiction linter for battery claims" and publish a power budget spreadsheet.

### Known Issues and Stability Challenges
*   **[Rejoin Storms](./rejoin-storm.md):** A "rejoin storm" issue consistently reproduces at 8 nodes, characterized by significant power spikes (110–340 µA) during parent swaps.
*   **Mesh Instability at Scale:** Customers have reported that the entire mesh stops reporting for hours after adding an 8th node, requiring a power cycle for temporary resolution (Support Ticket #2099).
*   **Firmware Status:** The rejoin spike is a known issue, with a fix targeted for the 0.3.8 firmware release. Mira Chen has noted it is "fine for beta" currently.
*   **Recommendation:** Users are advised to limit their mesh to 6 nodes until a patch is released.
*   **Documentation Discrepancy:** The discrepancy between the 15-minute spec and hourly documentation for sampling interval is a recurring issue.

### Future Development and Missing Specifications
*   **Hardware Consideration:** Comparison between [nRF52840](./nrf52840.md) and [nRF5340](./nrf5340.md) microcontrollers is planned for future revisions.
*   **Missing Spec Sections:** The current product specification is incomplete, lacking details on:
    *   Enclosure IP rating.
    *   [Over-the-Air (OTA) update](./over-the-air-ota-update.md) path.
    *   [MQTT](./mqtt.md) export schema.
*   **Internal Documentation:** A wiki page titled "known mesh quirks v0.3" has been suggested.

## Related Entities

*   **Aurora Nova Widget v2 beta unit:** The primary product utilizing MeshSync.
*   **Mira Chen:** Firmware owner for the Nova Widget, involved in MeshSync debugging.
*   **Jonah Park:** Hardware owner for the Nova Widget, involved in MeshSync debugging and enclosure design.
*   **[SenseNode SN-400](./sensenode-sn-400.md):** A competitor product mentioned for its ability to handle 10 devices with a simpler topology, but requiring a subscription.
*   **[TeaBuddy](./teabuddy.md):** An unrelated project that inquired about MeshSync for syncing tea timers.
*   **nRF52840 / nRF5340:** Microcontrollers considered for future hardware revisions.

## Related Concepts

*   **Open-source:** The Nova Widget and its MeshSync implementation are open-source.
*   **IoT Sensors:** The Nova Widget functions as a soil moisture and temperature sensor.
*   **[CR2032](./cr2032.md):** The type of battery used.
*   **Cloud Subscription:** A service model that MeshSync aims to avoid.
*   **[OTA Updates](./ota-updates.md):** A planned but currently missing feature for firmware updates.
*   **MQTT:** A messaging protocol for IoT, with its export schema currently undefined for MeshSync.
*   **[RSSI](./rssi.md) (Received Signal Strength Indicator):** A metric suggested for logging during rejoin events.
*   **[Hop Count](./hop-count.md):** Another metric suggested for logging during rejoin events.
*   **Complexity at Scale:** A known trade-off for mesh networks compared to simpler topologies.

## Contradictions

*   **Battery Life Claims:**
    *   **Marketing:** Claims 2 years of battery life.
    *   **Engineering:** Estimates 18 months of battery life when operating with 10 nodes.
*   **Sampling Interval Documentation:**
    *   **Product Specification:** States a 15-minute sampling interval.
    *   **Public Documentation:** Still incorrectly states an hourly default.

## Sources

*   `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md`
*   `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt`
*   `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt`
*   `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt`
```

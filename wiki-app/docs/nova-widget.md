---
id: nova-widget
title: Nova Widget
tags:
  - 15-min-default-interval
  - aurora
  - aurora-labs
  - aurora-mqtt-schema-v2
  - aurora-nova-widget-v2-beta-unit
  - batch-update-all
  - battery-life
  - ble-bluetooth-low-energy
last_updated: "2026-06-25T07:45:01.100568+00:00"
sidebar_label: Nova Widget
slug: /nova-widget
---

```markdown
# Nova Widget

## Overview

The Nova Widget is an open-source soil moisture and temperature sensor developed by [Aurora Labs](./aurora-labs.md). Conceived by [Mira Chen](./mira-chen.md) and [Jonah Park](./jonah-park.md), its mission is to provide "Open sensors for people who own their data," targeting home gardeners and small-acreage farmers. It features a local [MeshSync](./meshsync.md) mesh network and does not require a mandatory cloud subscription. A cheaper variant is also planned for hobbyists.

## Key Details

### Hardware

*   **Microcontroller (MCU):** [nRF52840](./nrf52840.md).
*   **Battery:** Single [CR2032](./cr2032.md). Hardware revision C includes a holder fix to prevent rattling.
*   **Sensors:**
    *   Capacitive soil probe (30mm length).
    *   Air temperature.
    *   Ambient light (simple photodiode).
*   **Connectivity:**
    *   [BLE](./ble.md) (Bluetooth Low Energy) for phone setup.
    *   MeshSync for mesh networking and range extension between nodes.

### Firmware

*   **Baseline:** MeshSync 0.3.8+.
*   **Default Read Interval:** 15 minutes.
*   [OTA Updates](./ota-updates.md): Deferred for the beta unit.

### Power & Battery

*   **Battery Type:** CR2032.
*   **Power Target:** 2 years on CR2032 with hourly readings (initial target).
*   **Battery Life Claims:**
    *   Marketing claims: 2 years.
    *   Engineering estimate: 18 months @ 10 nodes.
*   **Current Consumption:**
    *   Sleep: 4.2 µA (target).
    *   Sample + TX: 12 mA peak (at 15 min interval).
    *   Rejoin Spike: 110–340 µA (known issue).

### MeshSync Protocol

*   **Protocol:** Custom mesh protocol, codename MeshSync.
*   **Development:** Mira Chen is responsible for firmware and prototyping.
*   **Node Capacity:** Theoretical maximum of 32 nodes; beta tested to 8 (unstable).
*   **Parent Election:** Mechanism is still to be determined.
*   **Version Requirement:** MeshSync 0.3.8+ is a prerequisite for [Home Assistant](./home-assistant.md) integration.

### MQTT Export

*   **Functionality:** Optional local [MQTT](./mqtt.md) export, designed for local data ownership without mandatory cloud services.
*   **Compatibility:** Compatible with Home Assistant hobbyist setups.
*   **Schema:** Aurora MQTT schema v2.
*   **Topic Structure:**
    *   `aurora/{device_id}/telemetry`
    *   `aurora/{device_id}/battery`
    *   `aurora/{device_id}/mesh/neighbors`
*   **Payload Example:**
    ```json
    &#123;
      "soil_moisture_pct": 42,
      "temp_c": 19.2,
      "read_interval_min": 15,
      "battery_mv": 2980,
      "mesh_hops": 2
    &#125;
    ```
*   **Activation:** Enabled via UART command `mqtt on` until app support is available.
*   **Known Quirk:** Rejoin events can flood logs at 8 nodes; filtering the `mesh/neighbors` topic is recommended.

### OTA Updates

*   **Status:** Not shipping in beta units.
*   **Requirements:** Signed firmware images (ed25519) and rollback protection after mesh-wide upgrades.
*   **Methods:** BLE proxy update via phone app when a mesh node is unreachable.
*   **Risks:** Potential for bricking if a parent node fails during a push, and MeshSync routing table invalidation during flash operations.
*   **Open Question:** Whether OTA should require explicit user consent per node or allow a batch "update all" option.

### Enclosure

*   **Material:** 3D printed PETG for beta units; injection molding planned for later.
*   **Shape:** Pebble shape.
*   **Gasket:** Silicone 50A.
*   **IP Rating:** IP54 (splash resistant). An IP65 tooled variant was deferred due to cost.

### v1 Non-Goals

*   No camera or GPS functionality.
*   No subscription cloud dashboard (data export limited to CSV / MQTT).
*   No integration with [TeaBuddy](./teabuddy.md) steep events.
*   Aurora Labs will not host a cloud broker.

## Related Entities

*   **Aurora Labs:** The company developing the Nova Widget.
*   **Mira Chen:** Firmware lead, responsible for MeshSync, power profiling, MQTT schema, and OTA updates.
*   **Jonah Park:** Hardware lead, responsible for PCB, sensors, and mechanical design.
*   [SenseNode SN-400](./sensenode-sn-400.md): A competitor product noted for its IP67 waterproof rating.
*   **TeaBuddy:** An unrelated product that uses BLE (not mesh); [Sam Rivera](./sam-rivera.md) advised against merging codebases.

## Related Concepts

*   **BLE (Bluetooth Low Energy):** Used for device setup and potential OTA proxy updates.
*   **MeshSync:** The custom mesh networking protocol developed for the Nova Widget.
*   **MQTT (Message Queuing Telemetry Transport):** An optional local protocol for data export and integration with home automation systems.
*   **OTA (Over-The-Air) Updates:** The planned method for remote firmware updates.
*   **Home Assistant:** A popular open-source home automation platform with which the Nova Widget is designed to integrate.
*   **CR2032:** The coin cell battery type used by the device.
*   **nRF52840:** The chosen microcontroller unit for the device.
*   **[Capacitive Soil Probe](./capacitive-soil-probe.md):** The primary sensor for measuring soil moisture.

## Contradictions

*   **Battery Type:**
    *   **Contradiction:** Some documentation incorrectly states CR2450, but the correct battery is CR2032.
*   **Default Read Interval:**
    *   **Contradiction:** Initial kickoff notes mentioned a power target of 2 years with *hourly* readings, but the spec and firmware baseline state a *15-minute* default interval.
*   **Battery Life:**
    *   **Contradiction:** Marketing claims 2 years of battery life, while engineering estimates 18 months when operating with 10 nodes.

## Sources

*   `articles/TEST-product-brief.md`
*   `notes/2026-05-01-kickoff-notes.md`
*   `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md`
*   `samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md`
*   `samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md`
*   `samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md`
*   `samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md`
*   `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md`
```

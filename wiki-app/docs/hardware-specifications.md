---
id: hardware-specifications
title: Hardware Specifications
tags:
  - 15-min-default-interval
  - auroralabs
  - beta
  - capacitive-soil-probe
  - cr2032
  - cr2450
  - hardware-revision-c
  - hardware-specifications
last_updated: "2026-06-25T07:26:47.264896+00:00"
sidebar_label: Hardware Specifications
slug: /hardware-specifications
---

# Hardware Specifications

## Overview

This page details the hardware specifications for the Nova Widget, particularly focusing on Hardware Revision C. The Nova Widget is designed as a more affordable variant for hobbyists, featuring specific components and firmware configurations.

## Key Details

### General
*   **Product Variant**: Cheaper Nova Widget variant for hobbyists.
*   **Hardware Revision**: C (dated 2026-07-03).

### Electrical Components
*   **Microcontroller (MCU)**: nRF52840.
*   **Battery**: CR2032.
    *   Hardware Revision C includes a fix for the CR2032 holder to address rattling issues.
    *   Previous documentation or labels incorrectly mentioned CR2450, which was a misprint (ticket #2201).
*   **Probe**: Capacitive soil probe, 30mm length.

### Mechanical Design
*   **Enclosure**: PETG beta material, designed with a pebble shape (design by Jonah).
*   **Gasket**: Silicone 50A, providing IP54 splash protection.
*   **Ingress Protection (IP) Rating**:
    *   IP54 splash protection is standard.
    *   An IP65 tooled variant has been deferred due to cost ($7,850 quote).

### Firmware and Network
*   **Firmware Baseline**: MeshSync 0.3.8.
    *   Includes rejoin fixes and MQTT schema v2.
    *   Default interval is 15 minutes.
    *   Over-The-Air (OTA) updates are currently deferred.
*   **Network Nodes**:
    *   A maximum of 6 nodes is recommended for beta deployments.
    *   Improvements are being made to support 8 nodes.

## Related Entities

*   **AuroraLabs**: The developer and manufacturer of the Nova Widget and MeshSync firmware.
*   **Nova Widget**: The specific product to which these specifications apply.
*   **Jonah**: Designer of the enclosure for Hardware Revision C.
*   **Ticket #2201**: An internal ticket related to the CR2450 misprint on labels.

## Related Concepts

*   **MeshSync**: The proprietary mesh networking firmware used by AuroraLabs devices.
*   **OTA (Over-The-Air) Updates**: The capability to update device firmware wirelessly.
*   **MQTT Schema v2**: A specific version of the MQTT protocol schema used for data communication.
*   **IP54/IP65**: Ingress Protection ratings indicating the device's resistance to dust and water.
*   **Hobbyist Variant**: A product version tailored for enthusiasts, often with a focus on cost-effectiveness.

## Contradictions

There are no direct contradictions between the provided sources. However, it's important to note a clarification regarding battery type:
*   **Contradiction:** While some older information or misprints might have suggested CR2450, the definitive battery for Hardware Revision C is CR2032. This has been clarified by AuroraLabs and addressed in the hardware revision.

## Sources

*   `articles/TEST-product-brief.md`
*   `samples/social/[SAMPLE]-2026-07-02-twitter-thread-scrape.txt`
*   `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md`

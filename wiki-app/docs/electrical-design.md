---
id: electrical-design
title: Electrical Design
tags:
  - 15-min-default-interval
  - capacitive-soil-probe
  - cr2032
  - cr2450
  - electrical-design
  - hardware-revision-c
  - ip54
  - ip65
last_updated: "2026-06-25T07:21:29.032992+00:00"
sidebar_label: Electrical Design
slug: /electrical-design
---

# Electrical Design

## Overview

The electrical design for Hardware Revision C of the [Nova Widget](./nova-widget.md) focuses on a robust and efficient system, incorporating a specific microcontroller, battery solution, and sensing probe. Key improvements in this revision address previous mechanical issues related to battery housing and clarify battery type specifications.

## Key Details

*   **Microcontroller (MCU)**: The system utilizes the nRF52840 microcontroller, known for its Low-power design capabilities and wireless connectivity.
*   **Battery**:
    *   The Nova Widget is powered by a **CR2032** coin cell battery.
    *   Hardware revision C includes a redesigned battery holder that specifically fixes a rattle issue present in previous versions.
    *   It is crucial to note that **CR2450** is an incorrect battery type; previous misprints on labels caused support ticket #2201. Labels should explicitly *not* print CR2450.
*   **Probe**: A 30mm length Capacitive Soil Probe is integrated for environmental sensing.
*   **Firmware Baseline**: The electrical system operates with MeshSync 0.3.8 firmware, which includes a default data reporting interval of 15 minutes.
*   **Environmental Protection**:
    *   The device's enclosure, featuring a silicone 50A gasket, provides an **IP Rating** splash protection rating, safeguarding the internal electrical components from water splashes and dust ingress.
    *   An **IP65** tooled variant, offering higher protection against dust and water jets, has been deferred due to a $7,850 quote.

## Related Entities

*   Nova Widget
*   nRF52840 (Microcontroller)
*   CR2032 (Battery)
*   CR2450 (Incorrect battery type, historical misprint)
*   MeshSync (Firmware)

## Related Concepts

*   Capacitive Soil Probe
*   IP Rating (IP54, IP65)
*   Hardware Revision C
*   Low-power design
*   Firmware baseline

## Contradictions

No direct contradictions were found in the provided source material. The mention of CR2450 serves as a clarification regarding a past misprint, not a conflicting specification.

## Sources

*   `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md`

---
id: mechanical-design
title: Mechanical Design
tags:
  - hardware-revision-c
  - nova-widget
  - mechanical-design
  - enclosure
  - ip-rating
  - cr2032
  - jonah
  - capacitive-soil-probe
last_updated: "2026-06-25T07:40:04.245137+00:00"
sidebar_label: Mechanical Design
slug: /mechanical-design
---

# Mechanical Design

## Overview

The mechanical design for the Nova Widget, specifically for hardware revision C, focuses on a durable and functional enclosure with specific environmental protection. Key elements include a PETG enclosure, a silicone gasket for splash resistance, and a refined battery holder.

## Key Details

*   **Enclosure**:
    *   Material: PETG beta.
    *   Shape: Pebble-shaped, designed by Jonah.
    *   Environmental Protection: Achieves IP54 splash resistance with a silicone gasket.
    *   IP65 Variant: A more robust IP65-rated variant was quoted at $7,850 but has been deferred.
*   **Gasket**:
    *   Material: Silicone 50A.
    *   Function: Provides IP54 splash protection.
*   **Battery Holder**:
    *   Type: Designed for a CR2032 battery.
    *   Improvement: Hardware revision C includes a fix for a previous rattle issue in the CR2032 holder.
*   **Probe**:
    *   Type: Capacitive soil probe.
    *   Length: 30mm.
*   **Labeling Note**: It is critical to avoid printing "CR2450" on labels, as a previous misprint led to ticket #2201. The correct battery type is CR2032.

## Related Entities

*   **Nova Widget**: The product for which this mechanical design is specified.
*   **Jonah**: The designer credited with the pebble shape of the enclosure.
*   **nRF52840**: The MCU used in the Nova Widget, influencing internal mechanical layout.

## Related Concepts

*   **Hardware Revision C**: The specific iteration of the Nova Widget hardware to which these mechanical specifications apply.
*   **IP54**: An Ingress Protection rating indicating protection against dust ingress (limited) and water splashes from any direction.
*   **IP65**: A higher Ingress Protection rating indicating protection against dust ingress (total) and low-pressure water jets from any direction.
*   **PETG**: Polyethylene terephthalate glycol, a thermoplastic polyester used for the enclosure.
*   **Silicone 50A**: A type of silicone rubber with a Shore A hardness of 50, used for the gasket.
*   **CR2032**: A common lithium coin cell battery type.
*   **CR2450**: Another lithium coin cell battery type, which was incorrectly referenced in past labeling.
*   **Capacitive Soil Probe**: A sensor component with specific mechanical dimensions and integration requirements.
*   **15-min default interval**: The default data reporting interval for the device's firmware, a functional aspect influenced by power consumption and mechanical design constraints.

## Contradictions

No direct contradictions were found in the provided source material. The note regarding the CR2450 misprint is a correction of a past error, not a contradiction in the current design specification.

## Sources

*   `samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md`

---
id: sensors
title: Sensors
tags:
  - acidic-soil
  - aurora
  - capacitive-soil-probe-corrosion
  - coated-probe
  - gold-flashed-pcb
  - jonah
  - mira
  - nova-widget
last_updated: "2026-06-25T07:57:33.122280+00:00"
sidebar_label: Sensors
slug: /sensors
---

# Sensors

## Overview

Sensors are critical components in various monitoring systems, particularly for environmental data collection. A common challenge, especially with soil moisture sensors, is corrosion, which significantly impacts their lifespan and reliability. This page focuses on issues related to capacitive soil probes, specifically their susceptibility to corrosion in acidic environments and various approaches to mitigate this problem.

## Key Details

*   **Capacitive Soil Probe Corrosion**: Capacitive soil probes are prone to corrosion, particularly when exposed to acidic soil conditions.
*   **Lifespan Issues**: Cheap, standard capacitive soil probes have been observed to fail within 6–9 months when deployed in acidic soil.
*   **Corrosion Mitigation Strategies**:
    *   **Coated Probes**: The SenseNode SN-400 utilizes a coated probe design to enhance durability and resist corrosion. Replacement probes for the SN-400 cost approximately $12.
    *   **Gold-Flashed PCBs**: The Aurora beta probe incorporates a gold-flashed Printed Circuit Board (PCB) as a potential solution for corrosion resistance. However, its long-term performance in various soil conditions remains untested.
*   **Total Cost of Ownership**: The frequent failure of inexpensive probes due to corrosion necessitates replacements, which can significantly increase the total cost of ownership over time. This factor should be considered in product comparisons.
*   **Development Notes**:
    *   **Jonah's Note**: The impact of probe durability on total cost of ownership should be highlighted in comparison documentation.
    *   **Mira's Note**: While important, this corrosion issue is not considered a blocker for the initial version (v1) of related hardware but should be thoroughly documented in hardware specifications.

## Related Entities

*   **Nova Widget**: A hardware system that likely utilizes sensors, possibly including soil probes.
*   **SenseNode SN-400**: A specific sensor product known for using a coated probe design.
*   **Aurora**: A project or product line, currently in beta, experimenting with gold-flashed PCB probes.

## Related Concepts

*   **Acidic Soil**: A primary environmental factor contributing to sensor corrosion.
*   **Hardware Durability**: The ability of sensor components to withstand environmental stressors over time.
*   **Total Cost of Ownership (TCO)**: An economic calculation that includes the initial purchase cost plus the costs of operation, maintenance, and replacement over the product's lifespan.

## Contradictions

No contradictions were identified in the provided source material.

## Sources

*   `samples/research/[SAMPLE]-2026-07-04-soil-probe-corrosion-study.txt`

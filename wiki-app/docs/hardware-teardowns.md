---
id: hardware-teardowns
title: Hardware Teardowns
tags:
  - alex-rivera
  - aurora-labs
  - hardware-habit
  - hardware-teardowns
  - ip67-enclosure
  - lorawan
  - meshsync
  - nova-widget-v2
last_updated: "2026-09-01T19:19:14.048478+00:00"
sidebar_label: Hardware Teardowns
slug: /hardware-teardowns
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Teardowns

## Overview
[Hardware](./hardware.md) teardowns provide a granular analysis of commercial and pre-release electronic devices, revealing their internal components, build quality, [power consumption](./power-consumption.md) profiles, and real-world performance metrics. A notable analysis by author Alex Rivera on the *Hardware Habit* blog compares popular garden [sensors](./sensors.md), focusing specifically on the commercially available **[SenseNode SN-400](./sensenode-sn-400.md)** and the pre-release beta unit **[Nova Widget v2](./nova-widget-v2.md)** by **[Aurora Labs](./aurora-labs.md)**.

## Key Details
- **SenseNode SN-400 ($49)**:
  - Features an exceptional IP67 enclosure, providing top-tier weather sealing ideal for outdoor deployments.
  - Built with an STM32WL module utilizing [LoRaWAN](./lorawan.md) connectivity, requiring a cloud dashboard for alerts (with a limited free tier).
  - Manufacturer claims a 3-year [battery life](./battery-life.md), though estimated real-world performance is roughly 22 months at a default 30-minute reporting interval.
- **[Aurora Nova Widget v2](./aurora-nova-widget-v2.md) (Beta Unit)**:
  - Utilizes an IP54 plastic enclosure, offering moderate weather sealing that is visibly less rugged than the SenseNode.
  - Powered by an nRF52840 chip running a custom **MeshSync** mesh protocol, bypassing LoRaWAN subscription fees and supporting open [MQTT export](./mqtt-export.md) without requiring an account.
  - Uses a CR2032 coin cell battery (corrected from an initial misidentification of a CR2450 cell).
  - Power profiling over a 48-hour sample indicates an average draw of ~92 µA with a 3-node mesh setup, which is slightly higher than the manufacturer's 85 µA target. Real-world battery life is estimated around 20 months.

## Related Entities
- **Alex Rivera**: Author and hardware reviewer for the *Hardware Habit* blog.
- **Aurora Labs**: Developer of the pre-release Nova Widget v2.
- **SenseNode**: Manufacturer of the SN-400 garden sensor.
- **Hardware Habit**: Publication platform for the hardware teardown blog post.

## Related Concepts
- **IP67 Enclosure & IP54 Plastic**: Ingress Protection ratings determining dust and water resistance for electronic enclosures.
- **LoRaWAN & MeshSync**: Wireless communication [protocols](./protocols.md); LoRaWAN relies on gateway subscriptions/cloud networks, whereas MeshSync enables direct [mesh networking](./mesh-networking.md) without subscription fees.
- **Power Profiling**: Measuring current draw and estimating longevity for battery-powered [IoT](./iot.md) hardware.

## Contradictions
&gt; **Contradiction:** Aurora Labs claims a 2-year battery life for the Nova Widget v2 at 15-minute readings, based on an 85 µA target. However, Alex Rivera's 48-hour power profiling measured an average draw of ~92 µA with a 3-node mesh, resulting in a revised estimated battery life of approximately 20 months. Additionally, the manufacturer's claimed battery life for the SenseNode SN-400 is 3 years, while estimated real-world longevity sits at around 22 months.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `articles/2026-05-20-competitor-teardown-blog.md` | text | Medium |

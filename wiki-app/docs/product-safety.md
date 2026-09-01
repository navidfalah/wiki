---
id: product-safety
title: Product Safety
tags:
  - aurora-nova-widget
  - beta-firmware
  - beta-tester
  - confidentiality
  - data-telemetry
  - ip54-splash-resistant
  - meshsync-source-partial
  - mqtt-export
last_updated: "2026-06-25T07:51:43.183616+00:00"
sidebar_label: Product Safety
slug: /product-safety
---

```markdown
# Product Safety

## Overview
Product safety guidelines are crucial for the proper use and longevity of devices, especially during beta testing phases. For the [Aurora Nova Widget](./aurora-nova-widget.md), specific instructions regarding water resistance, usage environments, and data handling are provided to beta testers to ensure safe operation and data privacy.

## Key Details

### Safety Guidelines for Aurora Nova Widget
*   **Water Resistance**: The Aurora Nova Widget is rated IP54, meaning it is splash-resistant only.
*   **Usage Restrictions**:
    *   The device should **not** be submerged in water.
    *   Outdoor burial, similar to [SenseNode](./sensenode.md)-style installations, is **not supported** for the Aurora Nova Widget.

### Confidentiality
During the beta testing phase, certain materials are considered [Confidentiality](./confidentiality.md):
*   Beta Firmware
*   [MeshSync](./meshsync.md) source partial
*   Power budget spreadsheets

### Data Handling
*   **Telemetry**: Device Telemetry data remains local to the device by default.
*   **MQTT Export**: Users have the option to configure [MQTT Export](./mqtt-export.md) for telemetry data, which is user-controlled.

### Endorsement and Partnerships
*   Beta testers are permitted to mention products like [TeaBuddy](./teabuddy.md) or other third-party products.
*   Mentioning other products does not imply an Aurora partnership or endorsement.

## Related Entities
*   **Aurora Nova Widget**: The product undergoing beta testing, subject to these safety guidelines.
*   **TeaBuddy**: An example of a product that beta testers may mention without implying partnership.
*   **SenseNode**: A product mentioned as a reference for unsupported outdoor burial methods.

## Related Concepts
*   **IP54**: An Ingress Protection rating indicating protection against dust ingress (limited) and water splashes from any direction.
*   **Beta Firmware**: Pre-release software for testing, often subject to confidentiality.
*   **MeshSync**: A component or technology, with its source code (partial) being confidential.
*   **Telemetry**: Automated collection and transmission of data from remote sources.
*   **MQTT Export**: The process of sending telemetry data using the Message Queuing Telemetry Transport protocol, typically for integration with other systems.
*   **Confidentiality**: The state of keeping information secret or private.

## Contradictions
No contradictions were found in the provided source material.

## Sources
*   `samples/legal/[SAMPLE]-2026-07-04-beta-tester-agreement-snippet.txt`
```

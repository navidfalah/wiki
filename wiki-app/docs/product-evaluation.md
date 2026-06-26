---
id: product-evaluation
title: Product Evaluation
tags:
  - acidic-soil
  - aurora
  - capacitive-soil-probe-corrosion
  - coated-probe
  - gold-flashed-pcb
  - jonah
  - mira
  - nova-widget
last_updated: "2026-06-25T07:49:09.642741+00:00"
sidebar_label: Product Evaluation
slug: /product-evaluation
---

```markdown
# Product Evaluation

## Overview

Product evaluation involves assessing a product's performance, durability, and overall suitability for its intended use, often considering environmental factors and long-term costs. A key aspect of this evaluation is understanding potential failure points and the effectiveness of design choices or material selections. A specific case study in product evaluation involves the durability of [Capacitive Soil Probe](./capacitive-soil-probe.md)s, particularly their susceptibility to corrosion in challenging environments like [Acidic soil](./acidic-soil.md).

## Key Details

### Capacitive Soil Probe Corrosion

*   **Problem**: Cheap [Capacitive Soil Probe](./capacitive-soil-probe.md)s have demonstrated a short operational lifespan, typically failing within 6 to 9 months when deployed in [Acidic soil](./acidic-soil.md) conditions. This highlights a significant durability issue for hardware exposed to corrosive environments.
*   **Impact**: Such failures lead to frequent replacements, increasing the [Total Cost of Ownership](./total-cost-of-ownership.md) (TCO) for users.

### Mitigation Strategies and Alternatives

Several approaches are being explored or implemented to address the corrosion issue:

*   **Coated Probes**: The [SenseNode SN-400](./sensenode-sn-400.md) utilizes a coated probe design, which aims to protect the underlying electronics from corrosive elements. Replacement coated probes for the SenseNode SN-400 are available for $12.
*   **Gold-Flashed PCB**: The [Aurora](./aurora.md) beta probe incorporates a gold-flashed [Printed Circuit Board](./printed-circuit-board.md) ([PCB](./printed-circuit-board.md)) as a potential solution for enhanced corrosion resistance. The long-term durability of this design is currently untested.

### Evaluation Considerations

*   **[Total Cost of Ownership](./total-cost-of-ownership.md) (TCO)**: The recurring cost of replacing failed components, such as soil probes, is a critical factor in product evaluation. This should be explicitly considered in comparison pages, especially for products like the [Nova Widget](./nova-widget.md), to provide a comprehensive view of long-term expenses.
*   **Development Prioritization**: While the soil probe corrosion issue is significant, it has been noted that it is not considered a "v1 blocker" for certain product development cycles. However, it is crucial to document these hardware limitations and potential solutions within relevant hardware documentation pages for future iterations and user awareness.

## Related Entities

*   **[Nova Widget](./nova-widget.md)**: A product for which soil probe durability and TCO are relevant evaluation factors.
*   **[SenseNode SN-400](./sensenode-sn-400.md)**: A device that uses a coated capacitive soil probe.
*   **[Aurora](./aurora.md) (beta probe)**: A product featuring a gold-flashed [PCB](./printed-circuit-board.md) for improved corrosion resistance.
*   **[Jonah](./jonah.md)**: An individual who emphasized the importance of including [Total Cost of Ownership](./total-cost-of-ownership.md) in product comparisons.
*   **[Mira](./mira.md)**: An individual who noted the corrosion issue's priority level (not a v1 blocker) but stressed its documentation.

## Related Concepts

*   [Hardware durability](./hardware-durability.md)
*   [Environmental resilience](./environmental-resilience.md)
*   [Corrosion resistance](./corrosion-resistance.md)
*   [Acidic soil](./acidic-soil.md)
*   [Capacitive sensing](./capacitive-sensing.md)
*   [Total Cost of Ownership](./total-cost-of-ownership.md) (TCO)
*   [Product lifecycle management](./product-lifecycle-management.md)

## Contradictions

No contradictions were identified in the provided source material.

## Sources

*   `samples/research/[SAMPLE]-2026-07-04-soil-probe-corrosion-study.txt`
```

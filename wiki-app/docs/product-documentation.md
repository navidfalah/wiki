---
id: product-documentation
title: Product Documentation
tags:
  - product documentation
  - aurora nova widget
  - battery specifications
  - firmware
  - beta program
  - support
  - wiki
last_updated: "2026-06-25T07:48:48.307194+00:00"
sidebar_label: Product Documentation
slug: /product-documentation
---

# Product Documentation

## Overview
Product documentation for [Aurora Labs](./aurora-labs.md), particularly concerning the [Aurora Nova Widget](./aurora-nova-widget.md), is primarily hosted on a wiki and undergoes regular updates. This documentation covers critical product specifications, operational guidelines, and support information, aiming to provide accurate and up-to-date details for users, including beta testers and general customers.

## Key Details

### Aurora Nova Widget Documentation
*   **Primary Location**: The official documentation is compiled from raw sources and available at `wiki.auroralabs.example`.
*   **Updates**: A "docs refresh" was implemented for beta invite batch #3, indicating ongoing efforts to keep information current.
*   **Firmware 0.3.8**: Users are instructed to flash [firmware](./firmware.md) version 0.3.8 before adding more than 6 nodes to their Aurora Nova Widget setup.
*   **Default Read Interval**: The current default read interval for the Aurora Nova Widget is 15 minutes. This updates older documentation (e.g., an old PDF) that might state an hourly interval.
*   **Battery Specification**:
    *   The correct [battery specification](./battery-specifications.md) for the Aurora Nova Widget is CR2032.
    *   An earlier blog post by "Alex" incorrectly listed CR2450 but was corrected on 2026-06-20. The wiki page has also been updated to reflect the correct CR2032 specification.
*   **Battery Life**:
    *   The actual battery life of the Aurora Nova Widget is variable and depends on factors such as the number of nodes connected and the configured read interval (defaulting to 15 minutes).
    *   A detailed power budget document is expected to be published soon to provide more clarity on battery life expectations.

### Support and Issue Reporting
*   **Beta Program Issues**: Beta testers are directed to report issues via GitHub at `aurora-labs/meshsync #442`.
*   **General Support**: For other inquiries or issues, users can contact `support@auroralabs.example`.

### Related Products
*   **TeaBuddy**: The [TeaBuddy](./teabuddy.md) puck demo, showcased at Maker Faire, is an unrelated product from a different company and does not share the same application as the Aurora Nova Widget.

## Related Entities
*   **Aurora Labs**: The company developing the Aurora Nova Widget.
*   **Aurora Nova Widget**: The primary product discussed, a mesh network device.
*   **Alex**: A blog author who initially published incorrect battery specifications.
*   **Mira**: A support agent from [Aurora Labs](./aurora-labs.md).
*   **TeaBuddy**: An unrelated product from a different company.

## Related Concepts
*   **Beta Program**: A testing phase for new products, involving selected users.
*   **Firmware**: Embedded software that controls hardware.
*   **Battery Specifications**: Details about the type and characteristics of batteries used in a device.
*   **Read Interval**: The frequency at which a device collects or transmits data.
*   **Mesh Network**: A network topology where each node relays data for the network.
*   **Support Documentation**: Information provided to assist users with product usage and troubleshooting.

## Contradictions
*   **Read Interval**: An old PDF stated an hourly read interval, which has been superseded by the current default of 15 minutes.
*   **Battery Type**: Alex's teardown blog initially listed CR2450, contradicting the official CR2032 specification. This was corrected in the blog and wiki.
*   **Battery Life Expectation**: Marketing materials suggest a 2-year battery life, while forum discussions mention 18 months. The actual battery life is stated to depend on usage factors, with a power budget document pending for clarification.

## Sources
*   `samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt`
*   `samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt`

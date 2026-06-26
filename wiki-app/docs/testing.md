---
id: testing
title: Testing
tags:
  - beta-product-phase
  - incremental-test
  - ip54
  - ip65
  - jonah
  - mesh-network
  - product-testing
last_updated: "2026-06-25T08:03:43.574304+00:00"
sidebar_label: Testing
slug: /testing
---

# Testing

## Overview
Testing activities encompass various aspects of product development, including network performance, physical component durability, and specific functional checks. Key areas of focus include mesh network stability, ingress protection (IP) ratings for gaskets, and general product functionality.

## Key Details

*   **Mesh Network Testing**:
    *   Observations indicate the mesh network exhibits unusual behavior when operating with 8 nodes.
    *   A power spike of 110µA has been noted during network rejoin events.
    *   Despite these issues, the current state is considered "fine for beta" phase, suggesting further refinement may be needed post-beta.
    *   Mira is involved in these observations.

*   **Gasket Sample Testing**:
    *   Initial evaluations of gasket samples were deemed "meh," indicating suboptimal performance or quality.
    *   Testing confirmed compliance with **IP54** ingress protection standards.
    *   Achieving **IP65** protection would necessitate an $8,000 tool rip, highlighting a significant cost barrier for higher ingress protection.
    *   Jonah is involved in the assessment of gasket samples.

*   **Specific Test Types**:
    *   An **incremental test** is a recognized testing methodology.
    *   A **touch test** is also mentioned, likely referring to a physical interaction test.

*   **Product Design Considerations**:
    *   The concept of "open sensors for people who own their data" is a guiding principle that would influence testing requirements related to data privacy, security, and user control.

## Related Entities
*   **Mira**: Involved in mesh network testing and observations.
*   **Jonah**: Involved in gasket sample evaluation and IP rating assessments.

## Related Concepts
*   **Beta Product Phase**: A stage of product development where a nearly complete version is tested by a limited audience, often with known issues deemed acceptable for early feedback.
*   **IP Ratings (IP54, IP65)**: Standards for ingress protection, indicating the degree of protection against solids and liquids.
    *   **IP54**: Protected from dust ingress sufficient to prevent interference with the satisfactory operation of the equipment and from water spray from any direction.
    *   **IP65**: Dust tight and protected against low-pressure jets of water from any direction.
*   **Mesh Networks**: A network topology where each node relays data for the network, allowing for greater range and redundancy.
*   **Data Ownership**: A concept related to user rights and control over their personal data, which can influence product design and testing for privacy and security features.

## Contradictions
No direct contradictions regarding testing results or methodologies were found in the provided information.

## Sources
*   `notes/2026-06-01-standup-scribbles.txt`

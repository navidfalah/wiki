---
id: quality-assurance
title: Quality Assurance
tags:
  - agile-sprint
  - beta-testing
  - compile-run
  - contradiction-flag
  - firmware
  - nps
  - pairing
  - product-documentation
last_updated: "2026-06-25T07:54:18.213089+00:00"
sidebar_label: Quality Assurance
slug: /quality-assurance
---

# Quality Assurance

## Overview

Quality Assurance (QA) at TeaBuddy involves a multifaceted approach to ensure product quality, accuracy of documentation, and a positive user experience. This includes rigorous testing of firmware, managing beta programs, monitoring user feedback, and identifying and resolving discrepancies across various product materials and specifications.

## Key Details

*   **Documentation and Content Accuracy**:
    *   QA is responsible for identifying inconsistencies in product documentation and marketing materials.
    *   A notable discrepancy was found in the herbal box copy: print proof v3 and the marketing PDF stated a 5-minute duration, while the firmware and wiki indicated 7 minutes. This was flagged as a contradiction requiring resolution.
    *   There is an explicit process for flagging contradictions, with a question raised about when to formally apply a "CONTRADICTION flag."

*   **Firmware Development and Testing**:
    *   Firmware is a critical component, with its specifications needing to align with product documentation.
    *   A "firmware sprint" is a regular part of the development cycle, indicating an agile approach to firmware updates and fixes.
    *   Ongoing issues with meshsync pairing on 3-node mesh configurations require fixing before product demonstrations.
    *   Improvements have been observed in pairing functionality, with complaints decreasing after firmware version 0.9.3.

*   **Beta Testing and User Feedback**:
    *   Beta programs are conducted for new products, such as the nova widget, with beta boards being distributed.
    *   User feedback, including Net Promoter Score (NPS), is collected and analyzed. The raw beta NPS was reported as 42.
    *   Specific issues identified during beta testing, like pairing complaints, are tracked and addressed in subsequent updates.

*   **Product Specifications and Standards**:
    *   Product specifications, such as the IP54 rating for the senseNode, are subject to internal and external scrutiny. Concerns were raised about the perceived weakness of the IP54 rating based on a teardown blog.

*   **QA Workflow and Processes**:
    *   QA activities include updating test folders after each "compile run," indicating a post-compilation verification step.
    *   The process includes identifying and flagging contradictions in product information.

## Related Entities

*   **alex.kim**: Involved in product copy, documentation, and managing test folder updates.
*   **jamie.qa**: A key QA team member, responsible for flagging contradictions and reporting beta program metrics like NPS.
*   **sam.rivera**: Involved in print fixes and broader product decisions.
*   **aurora.mira**: Involved with nova widget beta boards and awareness of product specifications (e.g., senseNode IP54).
*   **jonah**: Involved in firmware development, specifically addressing meshsync pairing issues and firmware sprints.
*   **nova widget**: A product currently in beta testing.
*   **senseNode**: A product whose IP54 rating was subject to review.

## Related Concepts

*   **Agile Sprint**: Implied by "firmware sprint," indicating iterative development cycles.
*   **Beta Testing**: A phase of product development involving external users to identify bugs and gather feedback.
*   **Compile Run**: A development step often followed by QA verification.
*   **Contradiction Flag**: A mechanism for formally noting discrepancies in product information.
*   **Firmware Development**: The process of creating and updating embedded software for hardware.
*   **IP Rating**: Ingress Protection rating, indicating a device's resistance to dust and water.
*   **Meshsync Pairing**: A specific technical function related to device connectivity in a mesh network.
*   **Net Promoter Score (NPS)**: A metric used to gauge customer loyalty and satisfaction.
*   **Product Documentation**: Materials like marketing PDFs, print proofs, and wikis that describe product features and specifications.

## Contradictions

*   **Herbal Box Duration**:
    *   **Contradiction:** The print proof v3 and marketing PDF for the herbal box state a 5-minute duration, while the firmware and the wiki both indicate a 7-minute duration. This discrepancy was explicitly flagged by QA.

## Sources

*   `dummy-test/2026-07-06-slack-dump-product.txt`
*   `notes/TEST-slack-dump.txt`

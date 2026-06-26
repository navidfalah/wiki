---
id: beta-testing
title: Beta Testing
tags:
  - beta testing
  - ip54
  - ip65
  - cr2032 battery
  - cr2450 battery
  - meshsync
  - aurora labs
  - wiki maintenance
last_updated: "2026-06-25T07:13:27.451065+00:00"
sidebar_label: Beta Testing
slug: /beta-testing
---

# Beta Testing

## Overview

Beta testing at Aurora Labs involves a select group of users evaluating early versions of products. Key discussions and decisions around the beta program have focused on the specifications of the beta units, the demographics of testers, and the accuracy of technical details, particularly concerning battery types and default settings. The team is also actively working on improving the stability of the MeshSync protocol, which is critical for the beta units.

## Key Details

*   **Beta Tester Demographics:** The current beta tester list comprises 12 individuals: 3 farmers and 9 hobbyists.
*   **Beta Unit Specifications:**
    *   Initial beta units will ship with an IP54 ingress protection rating.
    *   Achieving an IP65 rating would require an additional $8,000 tool.
    *   MeshSync is currently stable at 8 nodes, though a 110 µA power spike is observed when a node rejoins the mesh.
*   **Default Settings for Beta Testers:**
    *   **Contradiction:** The product specification indicates a 15-minute default reporting interval for beta testers, but the beta kickoff meeting communicated an hourly default. This discrepancy needs to be resolved and documented clearly.
*   **Technical Corrections and Documentation:**
    *   A competitor teardown blog was generally accurate but initially contained an error regarding the battery type, which was later fixed.
    *   Alex's teardown incorrectly stated the battery as CR2450; the correct battery used is CR2032.
    *   There is an ongoing need to update the wiki to reflect accurate information and resolve contradictions.
*   **Internal Discussions:**
    *   Mira expressed caution regarding the publication of power numbers.
    *   The team acknowledged the importance of maintaining and updating the wiki.

## Related Entities

*   **People:**
    *   Mira
    *   Jonah
    *   Alex (author of a teardown)
*   **Organizations:**
    *   Aurora Labs
*   **Components/Technologies:**
    *   CR2032 battery
    *   CR2450 battery
    *   Gasket samples
    *   MeshSync

## Related Concepts

*   Ingress Protection (IP54, IP65)
*   Power Consumption
*   Competitor Analysis
*   Product Specifications
*   Wiki Maintenance

## Contradictions

*   **Beta Tester Default Reporting Interval:** The product specification states a 15-minute default, while the beta kickoff meeting communicated an hourly default. This needs clarification for beta testers and consistent documentation.

## Sources

*   `notes/2026-06-08-meeting-no-agenda.txt`
*   `transcripts/2026-05-28-weekly-sync.md`

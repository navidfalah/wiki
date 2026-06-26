---
id: internal-documentation
title: Internal Documentation
tags:
  - internal documentation
  - wiki updates
  - product specifications
  - battery
  - defaults
  - action items
  - aurora labs
  - contradictions
last_updated: "2026-06-25T07:28:48.778764+00:00"
sidebar_label: Internal Documentation
slug: /internal-documentation
---

# Internal Documentation

Internal documentation is critical for maintaining accuracy, consistency, and facilitating knowledge sharing across teams within Aurora Labs. This page synthesizes recent discussions and action items related to updating and correcting various internal documents, including the company wiki, product specifications, and shared spreadsheets.

## Overview

Recent discussions highlight the ongoing need to ensure that all internal documentation, from product specifications to blog posts and shared tools, accurately reflects current product details and decisions. Key areas of focus include correcting technical specifications, clarifying default settings for beta testers, and documenting performance metrics and shared resources.

## Key Details

*   **Default Settings for Beta Testers:**
    *   The product specification states a 15-minute default setting.
    *   Kickoff slides and discussions with beta testers have mentioned an hourly default.
    *   This discrepancy requires an urgent update to the wiki, with the contradiction clearly flagged.
*   **Battery Specifications:**
    *   Alex's blog and teardown documentation incorrectly listed the battery type as CR2450.
    *   The correct battery in use is the CR2032.
    *   This correction needs to be ingested into the wiki before the next forum scrape.
*   **Battery Life Expectations:**
    *   Marketing targets a battery life of two years.
    *   Engineering aims for a minimum of eighteen months at ten nodes.
*   **Battery Calculator Spreadsheet:**
    *   The TeaBuddy team requested to share Aurora Labs' battery calculator spreadsheet.
    *   Sharing is permissible with proper credit, but it's important to note that TeaBuddy's product uses different chemistry and has higher haptic draw, which may affect calculations.
*   **Power Consumption and MeshSync:**
    *   MeshSync is stable at 8 nodes.
    *   A power spike of 110 µA is observed when a node rejoins the mesh.
    *   An action item has been raised to revalidate power numbers after a fix for the rejoin issue is implemented.
*   **Gasket and IP Rating:**
    *   Gasket samples have been received.
    *   An IP54 rating is deemed acceptable for beta testing.
    *   Achieving an IP65 rating would require an $8,000 tool, as previously mentioned in the product specification by Mira.

## Related Entities

*   **Alex:** Author of a blog/teardown with incorrect battery information.
*   **Mira Chen:** Involved in discussions regarding specifications, IP ratings, and documentation updates.
*   **Jonah Park:** Involved in discussions regarding specifications, battery life, and documentation updates.
*   **TeaBuddy Team:** External team interested in sharing Aurora Labs' battery calculator spreadsheet.
*   **Aurora Labs:** The company developing the product and maintaining the documentation.
*   **Wiki Maintainer:** Responsible for updating and flagging contradictions in the internal wiki.

## Related Concepts

*   Product Specifications
*   Beta Testing
*   Battery Life and Chemistry
*   Power Consumption
*   MeshSync Technology
*   IP Ratings (Ingress Protection)
*   Knowledge Management
*   Documentation Updates and Corrections

## Contradictions

*   **Default Settings:**
    &gt; **Contradiction:** The product specification states a 15-minute default setting for beta testers, while kickoff slides and discussions indicated an hourly default. This discrepancy needs to be resolved and clearly documented.
*   **Battery Type:**
    &gt; **Contradiction:** Alex's blog and teardown documentation incorrectly identified the battery as CR2450. The correct battery in use is the CR2032.

## Sources

*   `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt`
*   `transcripts/2026-05-28-weekly-sync.md`

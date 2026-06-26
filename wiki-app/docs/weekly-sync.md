---
id: weekly-sync
title: Weekly Sync
tags:
  - alex
  - aurora-labs
  - beta-tester-defaults
  - cr2032-battery
  - cr2450-battery
  - ip54-rating
  - ip65-rating
  - jonah
last_updated: "2026-06-25T08:04:54.991060+00:00"
sidebar_label: Weekly Sync
slug: /weekly-sync
---

```markdown
# Weekly Sync

## Overview

This page summarizes key discussions and updates from the Aurora Labs weekly sync meeting held on May 28, 2026. Topics included MeshSync stability, IP rating requirements for gasket samples, beta tester default settings, and clarification on battery types. Several discrepancies between existing documentation and current practices were identified.

## Key Details

*   **Date:** 2026-05-28
*   **Participants:** Mira, Jonah
*   **MeshSync Status:**
    *   MeshSync is reported as stable at 8 nodes.
    *   A power consumption spike of 110 µA is observed when a node rejoins the mesh.
*   **Gasket Samples and IP Ratings:**
    *   New gasket samples have arrived.
    *   An IP54 rating is deemed acceptable for the beta phase.
    *   Achieving an IP65 rating would require an $8,000 tool, which Mira had previously mentioned in a specification.
*   **Beta Tester Default Settings:**
    *   There is a need to update the wiki regarding the default data reporting frequency for beta testers.
    *   The current specification states a 15-minute default, but the project kickoff meeting had initially promised hourly defaults.
*   **Battery Type:**
    *   Alex's teardown report incorrectly identified the battery as a CR2450.
    *   The correct battery type used is CR2032.
*   **Documentation Action:** Jonah noted an action to ingest this meeting transcript into the wiki after relevant specifications and teardown reports are already processed.

## Related Entities

*   **Alex:** Mentioned in relation to an incorrect battery type in a teardown report.
*   **Aurora Labs:** The company conducting the weekly sync.
*   **Jonah:** Participant in the sync, provided updates on IP ratings and clarified documentation.
*   **Mira:** Participant in the sync, provided updates on MeshSync and clarified battery type.

## Related Concepts

*   **Beta Testing:** Discussion around default settings for beta testers.
*   **CR2032 Battery:** The correct battery type used in the product.
*   **CR2450 Battery:** Incorrectly identified battery type in a teardown report.
*   **IP54 Rating:** Acceptable ingress protection rating for the beta phase.
*   **IP65 Rating:** Higher ingress protection rating requiring additional tooling.
*   **MeshSync:** A system component, discussed regarding its stability and power consumption.

## Contradictions

*   **Beta Tester Defaults:**
    *   **Contradiction:** The project specification states a 15-minute default for beta testers, while the project kickoff meeting had promised hourly defaults. This needs clarification and a wiki update.
*   **Battery Type:**
    *   **Contradiction:** Alex's teardown report incorrectly states the battery type as CR2450, but the actual battery used is CR2032.

## Sources

*   `transcripts/2026-05-28-weekly-sync.md`
```

---
id: meshsync-debugging
title: MeshSync Debugging
tags:
  - hop-count
  - jonah
  - mesh-quirks
  - meshsync
  - meshsync-debugging
  - mira
  - nrf52840
  - nrf5340
last_updated: "2026-06-25T07:41:11.460112+00:00"
sidebar_label: MeshSync Debugging
slug: /meshsync-debugging
---

# MeshSync Debugging

## Overview

A debug session involving Mira and Jonah on June 12 focused on persistent issues with MeshSync, specifically a "rejoin storm" observed in an 8-node mesh. This issue is characterized by significant power consumption spikes during parent node swaps. While the current state was deemed "fine for beta" by Mira, further debugging steps and potential hardware comparisons were discussed. A fundamental question regarding parent/child role determination within the mesh also arose.

## Key Details

*   **Problem Description:** A "rejoin storm" consistently reproduces in an 8-node mesh configuration.
*   **Symptoms:**
    *   A power consumption spike from 110µA to 340µA occurs during parent node swaps.
*   **Debugging Suggestions:**
    *   Jonah recommended logging every rejoin event, including the Received Signal Strength Indicator (RSSI) and hop count, to gather more diagnostic data.
*   **Unresolved Questions:**
    *   A whiteboard note from the session, though illegible in a photo, posed the fundamental question: "PARENT? CHILD? WHO DECIDES???" This highlights an underlying uncertainty or complexity in mesh role assignment.
*   **Stakeholder Feedback:**
    *   Mira indicated that the current state of the issue is "fine for beta," suggesting it might not be a critical blocker for immediate release but requires future attention.
*   **Potential Action Items:**
    *   Capture a 24-hour trace on a staging mesh to observe long-term behavior.
    *   Compare the performance and stability of nRF52840 versus nRF5340 hardware for the next revision of devices.
    *   Create a wiki page titled "known mesh quirks v0.3" to document observed behaviors and issues.
*   **Scope Limitations:**
    *   When asked by the Teabuddy team if the mesh could sync tea timers across a house, Mira responded, "absolutely not v1," indicating current MeshSync capabilities do not extend to such application-specific, cross-device synchronization.

## Related Entities

*   **Mira:** Key participant in the debug session, provided feedback on the issue's severity.
*   **Jonah:** Key participant in the debug session, suggested debugging steps.
*   **nRF52840:** A microcontroller under consideration for comparison in future revisions.
*   **nRF5340:** A microcontroller under consideration for comparison in future revisions.
*   **Teabuddy team:** An external team that inquired about MeshSync capabilities for their product.

## Related Concepts

*   **MeshSync:** The core synchronization technology being debugged.
*   **Rejoin storm:** A phenomenon where mesh nodes repeatedly disconnect and reconnect, leading to instability and increased power usage.
*   **Parent swap:** The process where a mesh node changes its parent node, often due to network changes or signal degradation.
*   **RSSI (Received Signal Strength Indicator):** A measurement of the power present in a received radio signal, useful for assessing link quality.
*   **Hop count:** The number of intermediate nodes a data packet travels through to reach its destination in a mesh network.
*   **Power consumption:** A critical metric, especially for battery-powered devices, where spikes indicate inefficiencies.
*   **Mesh quirks:** Unexpected or non-standard behaviors observed in a mesh network.

## Contradictions

No explicit contradictions were identified in the provided source material.

## Sources

*   `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt`

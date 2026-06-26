---
id: software-development
title: Software Development
tags:
  - software development
  - backlog grooming
  - wiki management
  - meshsync
  - aurora labs
  - beta testing
  - power management
  - contradictions
last_updated: "2026-06-25T07:58:04.710692+00:00"
sidebar_label: Software Development
slug: /software-development
---

# Software Development

## Overview

Software development encompasses a wide range of activities, from project management and product design to technical implementation and quality assurance. Key aspects include managing product backlogs, maintaining comprehensive documentation, addressing technical challenges like network stability and power efficiency, and ensuring a positive user experience. This overview synthesizes various development efforts, focusing on products like Aurora Labs' devices and TeaBuddy, alongside internal process improvements.

## Key Details

### Project Management & Development Practices

*   **Backlog Management**: Regular backlog grooming sessions prioritize tasks, identifying P0 items for products like Aurora and TeaBuddy.
*   **Issue Tracking**: GitHub issues are monitored for regressions, particularly after new releases (e.g., MeshSync 0.3.8).
*   **Standups**: Daily standup meetings (e.g., Aurora Labs) facilitate updates on progress, blockers, and wins.
*   **Testing**:
    *   Compiler stress tests are performed using extended dummy raw files.
    *   Beta testing is crucial, with new testers actively recruited and feedback monitored.
*   **Documentation**: Explicitly documenting contradictions within wiki pages is a recognized need.
*   **Tooling**: Development includes creating tools like a fake competitor name generator for demos.

### Wiki & Documentation Management

*   **Wiki Maintenance**: Efforts are underway to improve wiki quality, including:
    *   Developing a wiki linter to find and flag orphan pages.
    *   Addressing issues with `index.md` being out of date across projects.
    *   Exploring auto-generated sidebars for Docusaurus.
    *   Implementing a pipeline to compile raw text files into Markdown for Docusaurus.
*   **Contradiction Linter**: A linter is being considered to grep for and highlight "Contradiction:" blocks in documentation.

### Aurora Labs Product Development

*   **MeshSync**:
    *   The name "MeshSync" is confirmed and should not be renamed (repeatedly rejected "MeshSink").
    *   Persistent rejoin storms have been observed at 8 nodes on version 0.3.8, with a temporary workaround to cap at 6 nodes.
    *   Version 0.3.9, featuring a parent election rewrite, has been moved up as a milestone to address rejoin hardening.
*   **User Experience (UX)**: The "widget thing" is designed to feel like "garden equipment" rather than "surveillance."
*   **Power Management**:
    *   A color-coded LED is planned to indicate a "dying" battery state.
    *   Research includes nRF52840 sleep modes and CR2032 discharge curves.
    *   A power budget spreadsheet is a P0 priority for publication.
    *   Comparison of mesh power consumption versus LoRaWAN duty cycle is being researched.
*   **Hardware & Manufacturing**:
    *   PETG is specified for beta injection molds.
    *   Capacitive soil probe corrosion is an area of research.
    *   An IP65 gasket vendor quote for $8,000 is awaiting board approval.
*   **Features**: MQTT export to CSV is an optional dashboard feature, never mandatory.
*   **Competitor Analysis**: A comparison page for the SenseNode SN-400 is a P0 priority.

### TeaBuddy Product Development

*   **Android App**: Android v1.1 beta is in development.
*   **Bug Fixes**: Verification of the TB-142 cancel bug is ongoing.
*   **Content Audit**: A box copy audit for all presets is required.

### Shared & Other Initiatives

*   **Plant Whisperer App**: This app is in the shared icebox.
*   **Forum Scrapes**: Issues with the homelab forum scrape parser (especially nested quotes) and general forum scrape fixes are being addressed.

## Related Entities

*   **Individuals**:
    *   **Alex**: Involved in blog content (battery typo).
    *   **Jonah**: Involved in hardware decisions (PETG, gasket quotes).
    *   **Mira Chen**: Leads on MeshSync issues, MQTT, and general Aurora Labs development.
    *   **potato99**: GitHub user reporting MeshSync issues.
    *   **meshfan**: GitHub user reporting MeshSync issues.
    *   **teaguy**: GitHub user.
*   **Organizations/Products**:
    *   **Aurora Labs**: Primary development focus, especially MeshSync.
    *   **SenseNode SN-400**: Competitor product for comparison.
    *   **TeaBuddy**: Another product line with ongoing development.
    *   **Plant Whisperer**: An app in the shared icebox.
*   **Technologies/Concepts**:
    *   **MeshSync**: Core networking protocol/feature.
    *   **MQTT**: Protocol for data export.
    *   **nRF52840**: Microcontroller for power management research.
    *   **LoRaWAN**: Alternative wireless protocol for power comparison.
    *   **PETG**: Material for injection molding.
    *   **Docusaurus**: Platform used for wiki documentation.

## Related Concepts

*   Backlog grooming
*   Beta testing
*   Contradiction management
*   Wiki maintenance
*   Power management
*   Network protocols (mesh networking, LoRaWAN)
*   User experience (UX) design
*   Hardware development (injection molding, gaskets, sensors)
*   Software architecture (parent election)

## Contradictions

*   **Data Logging Frequency**:
    *   **Contradiction:** A discrepancy exists between hourly versus fifteen-minute data logging requirements, which needs to be resolved before beta testers are involved.
*   **Battery Claims**:
    *   **Contradiction:** There are conflicting claims between marketing and engineering regarding battery performance.
*   **Product Naming**:
    *   **Contradiction:** The name "MeshSync" has been repeatedly confirmed, with "MeshSink" consistently rejected, yet the suggestion to rename persists.
*   **Documentation Accuracy**:
    *   **Contradiction:** A typo regarding the CR2450 battery in Alex's blog is still indexed, indicating outdated or incorrect information.

## Sources

*   `articles/voice-memo-transcription.txt`
*   `ideas/backlog-shower-thoughts.txt`
*   `notes/2026-06-10-fragmented-research.txt`
*   `samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt`
*   `samples/ideas/[SAMPLE]-2026-07-10-backlog-grooming-snippet.txt`
*   `samples/notes/[SAMPLE]-2026-07-01-aurora-standup.txt`

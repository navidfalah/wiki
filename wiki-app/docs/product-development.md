---
id: product-development
title: Product Development
tags:
  - aurora-labs
  - nova-widget
  - meshsync
  - battery-life
  - ip-rating
  - beta-testing
  - sprint-planning
  - tea-buddy-partnership
last_updated: "2026-06-25T07:48:36.570014+00:00"
sidebar_label: Product Development
slug: /product-development
---

# Product Development

## Overview

Product Development at Aurora Labs centers around the **Nova Widget**, a soil moisture and temperature sensor designed for gardeners who value data ownership. The product utilizes **MeshSync** for extended range and aims for a balance between robust functionality, durability, and long battery life. Development follows an agile approach, with ongoing sprints addressing technical challenges, refining features, and preparing for market release.

## Key Details

### Product Vision and Core Offering
*   **Vision**: To provide "open sensors for gardeners who own their data."
*   **Product Name**: Nova Widget.
*   **Core Functionality**: Soil moisture and temperature sensing, with MeshSync for range.

### Technical Specifications
*   **Microcontroller (MCU)**: nRF52840, with evaluation on nRF5340 boards for performance profiling.
*   **Battery Target**: An 18-month battery life is the engineering target.

### MeshSync Development
*   **Current Status**: MeshSync 0.3.8 has shipped, including a rejoin fix that unblocks 8-node deployments.
*   **Challenges**: Despite fixes, the mesh can still exhibit "weird" behavior at 8 nodes, with a 110µA spike on rejoin. Pairing has also been reported as flaky on 3-node meshes.
*   **Recommendations**: While 0.3.8 mitigates issues, 6 nodes are recommended for beta customers.
*   **Ongoing Work**: Stabilizing the 8-node mesh is a current sprint goal.
*   **Branding**: A proposal to rename MeshSync to MeshSink has been rejected multiple times.

### Battery Life
*   **Engineering Claim**: 18 months at 10 nodes with 15-minute read intervals.
*   **Marketing Claim**: Rounds up to 2 years.
*   **Documentation**: A power budget spreadsheet is planned for publication in Q3 to clarify battery performance.
*   **Components**: CR2032 cells are used, with supply chain considerations noted.

### Durability and IP Rating
*   **Current Status**: Beta units are shipping with an IP54 rating, indicating splash resistance, due to an $8,000 tooling cost deferral for IP65.
*   **Future Goal**: IP65 is targeted once tooling is funded.
*   **Competitive Landscape**: The SenseNode SN-400 offers an IP67 rating, which is perceived as superior for outdoor waterproof applications. Aurora Labs' IP54 has been noted as "weak" in competitor teardown blogs.
*   **Strategy**: A comparison page update against SenseNode SN-400 is planned.

### Beta Program
*   **Deployment**: 47 Nova Widget beta units are currently in the field.
*   **Testers**: The beta tester list includes 12 individuals, comprising 3 farmers and the rest hobbyists.
*   **Hardware**: Beta boards have been received.

### Funding and Investment
*   **Investor Interest**: A wiki compiler demo impressed a seed investor.
*   **Funding Ask**: Aurora Labs is seeking a $500k bridge investment for injection molds and two additional full-time firmware engineers.
*   **Investor Relations**: An `index.md` refresh is planned before an investor demo.

### Development Process
*   **Agile Sprints**: Firmware sprints are ongoing, with Sprint 15 focusing on stabilizing the 8-node mesh and publishing the power budget.
*   **Carried Over Tasks**: A contradiction linter for battery claims and an `index.md` refresh are carried over tasks.
*   **Stretch Goals**: An OTA (Over-The-Air) update design document is a stretch goal.
*   **Documentation**: Regular wiki updates are recognized as a recurring need.

## Related Entities

*   **Aurora Labs**: The company developing the Nova Widget.
*   **Mira Chen**: CEO of Aurora Labs, involved in strategic decisions, investor relations, and technical profiling.
*   **Jonah Park**: Involved in hardware, IP rating decisions, and competitive analysis.
*   **SenseNode SN-400**: A key competitor in the outdoor sensor market, known for its IP67 rating.
*   **TeaBuddy**: A separate company (led by Alex Kim) with whom Aurora Labs has discussed co-marketing opportunities.
*   **Alex Kim**: Founder/lead at TeaBuddy, friend of Mira Chen.
*   **Sam Rivera**: TeaBuddy team member, involved in co-marketing discussions.
*   **Jamie QA**: TeaBuddy team member, involved in product documentation.

## Related Concepts

*   **Mesh Networking**: The core communication technology (MeshSync) for extending sensor range.
*   **IP Ratings**: Standards for ingress protection, crucial for outdoor product durability.
*   **Battery Life Optimization**: A critical design goal, balancing performance with longevity.
*   **Agile Development**: The methodology used for product development, involving sprints and continuous iteration.
*   **Beta Testing**: The process of deploying early product versions to gather feedback from users.
*   **Co-marketing**: Potential partnership strategy with TeaBuddy.

## Contradictions

*   **Aurora Labs Battery Life Claims**:
    *   **Contradiction:** Engineering claims 18 months, while marketing rounds this up to 2 years. A power budget spreadsheet is being prepared to clarify.
*   **TeaBuddy Herbal Box Copy**:
    *   **Contradiction:** For TeaBuddy's product, the herbal box print proof v3 states 5 minutes, while the firmware and wiki (after last compile) state 7 minutes. This is a TeaBuddy-specific documentation issue.

## Sources

*   `dummy-test/2026-07-04-investor-update-draft.txt`
*   `dummy-test/2026-07-06-slack-dump-product.txt`
*   `notes/2026-06-01-standup-scribbles.txt`
*   `notes/2026-06-08-meeting-no-agenda.txt`
*   `notes/TEST-kickoff-meeting.txt`
*   `notes/TEST-slack-dump.txt`
*   `samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt`
*   `samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt`

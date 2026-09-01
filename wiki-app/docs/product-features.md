---
id: product-features
title: Product Features
tags:
  - aurora-nova-widget
  - battery-life
  - waterproofing
  - local-mesh
  - no-subscription
  - beta-program
  - sensenode-competitor
  - open-firmware
last_updated: "2026-06-25T07:49:22.802939+00:00"
sidebar_label: Product Features
slug: /product-features
---

# Product Features

The [Aurora Nova Widget](./aurora-nova-widget.md), often referred to as the "Aurora Labs Nova thing," is a sensor device developed by [Aurora Labs](./aurora-labs.md). Its key features emphasize Local Mesh Networking, a Subscription Model-free model, and a focus on Open Firmware.

## Overview

The Aurora Nova Widget is designed for home lab and environmental monitoring, offering a local mesh synchronization ("meshsync") capability that operates without requiring cloud services or subscriptions. It aims to provide an alternative to competitor products like [SenseNode](./sensenode.md) by offering open export options and partial open firmware. The product is currently in a beta phase, with ongoing development for features like improved waterproofing.

## Key Details

### Connectivity and Network

*   **Local Mesh Networking**: The Aurora Nova Widget utilizes a local mesh network for data synchronization, eliminating the need for cloud services.
*   **No Cloud Dependency**: Data is processed and stored locally, aligning with privacy-focused user preferences.
*   **Open Export**: The system supports open data export, allowing users greater control over their data.
*   **Open Firmware**: The device features partially open firmware, encouraging community integrations and customization.
*   **Mesh Stability**: An issue with eight-node mesh configurations was mitigated in firmware version 0.3.8. For beta customers, a maximum of six nodes is recommended for optimal performance.

### Battery Life

*   **Engineering Estimate**: Engineering tests indicate a battery life of approximately eighteen months when operating with ten nodes and taking readings every fifteen minutes.
*   **Marketing Claim**: Marketing materials round this engineering estimate to "two years" for typical usage scenarios.

### Waterproofing and Durability

*   **Current Rating (Beta)**: The Aurora Nova Widget is currently rated IP Ratings (Ingress Protection) IP54, meaning it is protected from dust ingress (limited protection) and water splashes from any direction.
*   **Roadmap**: Aurora Labs plans to upgrade the waterproofing to IP65 (dust-tight and protected against water jets) once tooling funding is secured.
*   **Comparison to Competitors**: Competitors like SenseNode offer IP67 waterproofing (dust-tight and immersion up to 1m), which is a higher standard than the Aurora Nova's current rating. This difference is attributed to cost and tooling tradeoffs during development.
*   **Recommendations**: For outdoor installations, especially in wet environments like raised garden beds in the Pacific Northwest, a protective cover is recommended.

### Subscription Model

*   **Subscription-Free**: A core differentiator for the Aurora Nova Widget is its lack of a mandatory subscription service, contrasting with some competitors.

### Beta Program

*   **Beta Invites**: Access to the Aurora Nova Widget is currently managed through a beta invite program.
*   **Beta Focus**: The beta program emphasizes testing and feedback on the local mesh functionality and open export capabilities.
*   **Node Recommendation**: Beta customers are advised to use a maximum of six nodes in their mesh network.

## Related Entities

*   **Aurora Labs**: The company developing the Aurora Nova Widget.
*   **SenseNode**: A competitor product known for its IP67 waterproofing and subscription model.
*   **TeaBuddy**: A separate product, described as splash-resistant for kitchen use. Aurora Labs has a [Co-marketing](./co-marketing.md) partnership with [TeaBuddy](./teabuddy.md), but there is no product merger.
*   **Alex**: An individual mentioned in connection with the TeaBuddy co-marketing partnership.
*   **Mira Chen**: An Aurora Labs representative, likely in a leadership or investor relations role.
*   **Jonah Park**: An Aurora Labs representative, likely involved in product development or support.

## Related Concepts

*   **Local Mesh Networking**: A decentralized network topology where devices communicate directly with each other without a central hub or cloud server.
*   **IP Ratings (Ingress Protection)**: A standard defining the sealing effectiveness of electrical enclosures against intrusion from foreign bodies (like dust) and moisture.
*   **Open Firmware**: Firmware that is publicly available and can be modified or inspected by users.
*   **Subscription Model**: A business model where customers pay a recurring price for access to a product or service.
*   **Co-marketing**: A collaborative effort between two or more companies to promote each other's products or services.

## Contradictions

*   **Battery Life Claim vs. Engineering**: While marketing states "two years" of battery life, engineering estimates are closer to "eighteen months" at specific usage parameters (ten nodes, fifteen-minute reads). This is clarified as marketing "rounding" the engineering figures.
*   **Waterproofing Expectations**: Customers sometimes confuse the Aurora Nova Widget's IP54 rating with the higher IP67 rating of competitors like SenseNode. Aurora Labs has stated that IP65 is on the roadmap, but IP67 is not currently planned due to cost and tooling considerations.

## Sources

*   `articles/scraped-forum-thread.txt`
*   `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt`
*   `samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt`

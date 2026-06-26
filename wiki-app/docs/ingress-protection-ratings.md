---
id: ingress-protection-ratings
title: Ingress Protection Ratings
tags:
  - aurora-nova-widget
  - costtooling-tradeoff
  - gardener
  - ingress-protection-ratings
  - ip54
  - ip65
  - ip67
  - jonah
last_updated: "2026-06-25T07:28:35.781028+00:00"
sidebar_label: Ingress Protection Ratings
slug: /ingress-protection-ratings
---

# Ingress Protection Ratings

## Overview

Ingress Protection (IP) ratings are an international standard (IEC 60529) used to classify and rate the degree of protection provided by mechanical casings and electrical enclosures against intrusion from solids (dust, dirt) and liquids (water). These ratings are crucial for determining a device's suitability for various environments, especially outdoor or harsh conditions. This page details the IP ratings relevant to several products, including the Aurora Nova Widget, SenseNode, and TeaBuddy puck.

## Key Details

*   **Aurora Nova Widget:**
    *   Currently rated **IP54**. This rating indicates protection against dust ingress (limited ingress permitted, no harmful deposits) and protection against water splashes from any direction.
    *   An Aurora Nova Widget unit installed in a raised garden bed failed due to rain, confirming that IP54 is not sufficient for direct exposure to precipitation.
    *   The current IP54 rating is a result of a cost/tooling tradeoff during its beta development, which focused on local mesh capabilities and open export features.
    *   A higher rating of **IP65** is on the product roadmap for the Aurora Nova Widget, which would offer protection against dust ingress and low-pressure water jets from any direction.
    *   It is recommended to use a protective cover for Aurora Nova Widgets deployed in outdoor environments exposed to rain.

*   **SenseNode (Competitor SN-400):**
    *   Implied to have a higher IP rating, likely **IP67**, as a SenseNode unit installed in a similar outdoor environment remained functional despite rain that damaged an Aurora Nova Widget.
    *   IP67 signifies complete protection against dust ingress and protection against immersion in water up to 1 meter for 30 minutes.

*   **TeaBuddy Puck:**
    *   Described as "splash-resistant" and intended for kitchen use.
    *   This indicates a lower level of liquid protection compared to devices with specific IP ratings like IP54 or IP67, making it unsuitable for outdoor or direct water exposure.

*   **Product Development Considerations:**
    *   The choice of an IP rating often involves a tradeoff between manufacturing costs, tooling requirements, and desired product features or market focus.
    *   Product roadmaps can include plans for improving IP ratings in future iterations based on customer feedback and market needs.

## Related Entities

*   **Aurora Nova Widget:** A product with an IP54 rating, currently not suitable for direct rain exposure.
*   **SenseNode (Competitor SN-400):** A competitor product implied to have a higher IP rating (likely IP67), demonstrating better water resistance.
*   **TeaBuddy Puck:** A different product designed for kitchen use with splash resistance.
*   **Jonah:** An agent involved in customer support regarding IP rating confusion.
*   **Gardener:** A customer who experienced product failure due to water ingress.

## Related Concepts

*   **Cost/Tooling Tradeoff:** The balance between manufacturing expenses, specialized equipment, and product features, influencing design decisions like IP ratings.
*   **Product Roadmap:** A plan that outlines the evolution of a product over time, including planned feature enhancements like improved IP ratings.
*   **Beta Product Development:** An early stage of product development where focus might be on core functionality and specific features, with later iterations addressing broader environmental resistances.
*   **Splash Resistance vs. Waterproofing:** Distinct levels of protection against liquids; splash resistance offers minimal protection, while waterproofing (e.g., IP67) allows for immersion.

## Contradictions

No contradictions were identified in the provided source material.

## Sources

*   `samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt`

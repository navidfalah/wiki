---
id: show-hn
title: Show HN
tags:
  - ip67-rating
  - lan-first-architecture
  - meshsync
  - mirachen
  - nova-widget
  - show-hn
  - wiki
last_updated: "2026-09-01T21:25:33.960891+00:00"
sidebar_label: Show HN
slug: /show-hn
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Show HN

## Overview
This wiki page covers the Hacker News "Show HN" submission and community discussion for the **[Nova Widget](./nova-widget.md)**, a local mesh soil sensor developed by user `mirachen`. Posted on July 10, 2026, the submission garnered 142 points and sparked a technical discussion regarding [hardware design](./hardware-design.md), [battery life](./battery-life.md), [networking](./networking.md) choices, and enclosure ratings.

## Key Details
* **Project Name:** Nova Widget beta
* **Creator / OP:** `mirachen`
* **Core Features:** [MeshSync](./meshsync.md) technology, optional [MQTT](./mqtt.md) support, and a completely local, non-mandatory cloud architecture.
* **Power Source & Longevity:** Powered by a CR2032 coin cell battery taking readings every 15 minutes (with a detailed battery spreadsheet promised by the creator).
* **Networking Strategy:** Designed with a LAN-first architecture and lower duty cycle rather than standard Wi-Fi to optimize energy consumption.
* **Enclosure:** The discussion touched on enclosure durability, specifically comparing IP67 and IP54 ratings.

## Related Entities
* **`mirachen`:** The original poster and creator of the Nova Widget beta.
* **`@dang`:** Hacker News moderator who questioned if the submission was a duplicate of a May thread.
* **[Teabuddy](./teabuddy.md):** A related project seen at a faire by community members, confirmed by the creator to be built by friends at a different company.

## Related Concepts
* **LAN-First Architecture:** A design philosophy prioritizing local network communication and reducing dependency on external cloud services.
* **MeshSync:** A synchronization mechanism used in the Nova Widget's [mesh networking](./mesh-networking.md) approach.
* **IP67 vs. IP54 Ratings:** Environmental protection standards for enclosures; community members debated the necessity of IP67 over IP54, with the creator acknowledging IP67's validity for submersion use cases.
* **Duty Cycle & Battery Math:** Calculations concerning energy consumption, sleep intervals, and lifespan when utilizing CR2032 batteries for periodic [IoT](./iot.md) sensor reads.

## Contradictions
&gt; **Contradiction:** Moderator `@dang` questioned whether the July submission was a duplicate of an earlier May thread, though no formal resolution or removal was documented in the scraped thread excerpt.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt` | text | Unverified |

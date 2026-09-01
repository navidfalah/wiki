---
id: hardware
title: Hardware
tags:
  - hardware
  - ip67-rating
  - lan-first-architecture
  - meshsync
  - mirachen
  - nova-widget
  - wiki
last_updated: "2026-09-01T19:19:15.640298+00:00"
sidebar_label: Hardware
slug: /hardware
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware

## Overview
The hardware discussion centers around the [Nova Widget](./nova-widget.md) beta, a local mesh soil sensor introduced by user *[mirachen](./aurora-labs.md)* on Hacker News in July 2026. The device emphasizes local-first [networking](./networking.md), low [power consumption](./power-consumption.md), and environmental durability, distinguishing itself from standard cloud-dependent [IoT](./iot.md) solutions.

## Key Details
- **Power Source:** Powered by a CR2032 coin cell battery, configured for 15-minute read intervals. A dedicated battery math spreadsheet was promised by the creator.
- **Architecture & Connectivity:** Features a LAN-first architecture utilizing MeshSync with optional [MQTT](./mqtt.md) support, avoiding any mandatory cloud dependency to ensure a lower duty cycle and improved local reliability.
- **Environmental Rating:** Built with an IP67 rating, prioritizing superior dust and water protection over lesser standards like IP54, making it suitable for demanding outdoor and submersion use cases.

## Related Entities
- **Nova Widget:** The core beta product being discussed, developed by OP (*mirachen*).
- **mirachen:** The project creator and original poster of the Hacker News thread.
- **[TeaBuddy](./teabuddy.md):** A related product seen at a faire by community members; confirmed by the OP to be from a different company founded by friends.

## Related Concepts
- **MeshSync:** The local mesh protocol utilized by the hardware for communication.
- **LAN-First Architecture:** A design philosophy emphasizing local network communication over cloud routing.
- **IP67 Rating:** An ingress protection standard providing robust resistance against dust and water immersion.

## Contradictions
*There are no direct contradictions present in the provided source material.*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt` | text | Unverified |

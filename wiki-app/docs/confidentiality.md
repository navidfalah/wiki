---
id: confidentiality
title: Confidentiality
tags:
  - auroranovawidget
  - betatesterconfidentiality
  - confidentiality
  - meshsync
  - sensenode
  - teabuddy
last_updated: "2026-09-02T06:39:05.208289+00:00"
sidebar_label: Confidentiality
slug: /confidentiality
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Confidentiality

## Overview
The confidentiality requirements and related terms for participants testing the [Aurora Nova Widget](./aurora-nova-widget.md) beta program are outlined in the official beta tester agreement. This framework governs sensitive [hardware](./hardware.md) and software components, safety guidelines, telemetry handling, and product mention restrictions.

## Key Details
- **Confidentiality Scope (Section 4):** Beta [firmware](./firmware.md), the partial [MeshSync](./meshsync.md) source code, and [power budget](./power-budget.md) spreadsheets are strictly confidential.
- **Safety Restrictions (Section 7):** The device is rated IP54 splash-resistant only and must not be submerged. Outdoor burial (similar to [SenseNode SN-400](./sensenode-sn-400.md)-style applications) is not supported.
- **Data & Telemetry (Section 9):** All telemetry remains local by default, with optional [MQTT Export](./mqtt-export.md) available only via user configuration.
- **Endorsement and Product Mentions (Section 12):** Beta testers are permitted to mention [TeaBuddy](./teabuddy.md) or other products, but such mentions must not imply an official Aurora partnership.

## Related Entities
- **Aurora Nova Widget:** The primary product subject to the beta tester agreement and confidentiality terms.
- **TeaBuddy:** A product that beta testers are allowed to mention without implying an Aurora partnership.
- **SenseNode:** Referenced as a style of outdoor burial that is incompatible with the Aurora Nova Widget's [Hardware Safety](./hardware-safety.md) rating.

## Related Concepts
- **Beta Firmware:** Covered under Section 4 confidentiality protections.
- **MeshSync:** Software component whose partial source code is classified as confidential.
- **Power Budget Spreadsheets:** [Documentation](./documentation.md) included under the confidential materials list.
- **Telemetry:** Local data collection framework with optional user-configured MQTT export.
- **IP54 Splash-Resistance:** The official hardware safety rating limiting liquid exposure.

## Contradictions
*(None present in the provided source material)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/legal/[SAMPLE]-2026-07-04-beta-tester-agreement-snippet.txt` | text | Unverified |

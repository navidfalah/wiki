---
id: hardware-safety
title: Hardware Safety
tags:
  - aurora-nova-widget
  - beta-tester-confidentiality
  - endorsement-restrictions
  - hardware-safety
  - hardware-safety-rating
  - meshsync
  - sensenode
  - teabuddy
last_updated: "2026-09-01T19:19:06.641821+00:00"
sidebar_label: Hardware Safety
slug: /hardware-safety
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Safety

## Overview
This wiki page details the [hardware](./hardware.md) safety guidelines, ratings, and operational constraints for [Beta Testing](./beta-testing.md) devices such as the [Aurora Nova Widget](./aurora-nova-widget.md), based on standard beta tester agreement [Documentation](./documentation.md).

## Key Details
* **Ingress Protection Rating:** The device holds an IP54 splash-resistant rating.
* **Submersion Warning:** The device must not be submerged in liquids.
* **Outdoor Installation Limits:** Outdoor burial methods, similar to those used for [SenseNode SN-400](./sensenode-sn-400.md) devices, are explicitly not supported.
* **[Confidentiality](./confidentiality.md) Scope:** Beta [Firmware](./firmware.md), partial MeshSync source code, and [Power Budget](./power-budget.md) spreadsheets associated with the device are strictly confidential.
* **Data Handling:** Telemetry data remains local by default, with optional [MQTT Export](./mqtt-export.md) available via user configuration.

## Related Entities
* **Aurora Nova Widget:** The primary beta hardware device subject to these safety and confidentiality guidelines.
* **SenseNode:** Referenced as an example of outdoor burial installation that is incompatible with the Nova Widget's design.
* **[TeaBuddy](./teabuddy.md):** A related product that beta testers are permitted to mention under specific endorsement guidelines.

## Related Concepts
* **Hardware Safety Rating:** The specific IP54 classification governing the device's environmental resilience against splashes.
* **Beta Tester Confidentiality:** Legal and operational restrictions protecting proprietary firmware, source code, and [Power Management](./power-management.md) spreadsheets during the testing phase.
* **Endorsement Restrictions:** Rules governing public statements by beta testers, ensuring no implied official partnership with Aurora.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/legal/[SAMPLE]-2026-07-04-beta-tester-agreement-snippet.txt` | text | Unverified |

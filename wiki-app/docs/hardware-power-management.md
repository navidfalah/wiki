---
id: hardware-power-management
title: Hardware Power Management
tags:
  - aurora-labs
  - hardware-power-management
  - jonah-park
  - mesh-118
  - mira-chen
  - radio-wake-time
  - relay-radio-sleep-timer
  - wiki
last_updated: "2026-09-01T19:19:00.431812+00:00"
sidebar_label: Hardware Power Management
slug: /hardware-power-management
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Hardware Power Management

## Overview
[Hardware](./hardware.md) [power management](./power-management.md) focuses on optimizing energy consumption and resolving [battery drain](./battery-drain.md) issues across [networking](./networking.md) and mesh hardware components. Recent field reports and bench tests have identified specific inefficiencies in relay radio sleep cycles, prompting targeted [firmware](./firmware.md) adjustments to improve overall device [battery life](./battery-life.md).

## Key Details
* **Bench Confirmation:** Bench tests confirmed that the relay radio's sleep timer incorrectly resets on every incoming packet. Consequently, in a busy mesh network, continuous packet traffic prevents the radio from ever entering a sleep state, resulting in accelerated battery drain.
* **Draft Fix ([MESH-118](./mesh-118.md)):** To address the sleep-timer issue, ticket MESH-118 proposes reducing the radio wake time from 400ms to 80ms per hop.
* **Release Schedule:** A [Release 0.3.9](./release-039.md) candidate build incorporating this fix is scheduled for release by Friday to allow for retesting on batch 4 field units.

## Related Entities
* **Jonah Park:** [Aurora Labs](./aurora-labs.md) engineer who confirmed the bench test results and drafted the MESH-118 fix.
* **Mira Chen:** Aurora Labs team member responsible for retesting the 0.3.9 candidate build on batch 4 units.
* **Aurora Labs:** Organization overseeing the engineering and field testing of the hardware.

## Related Concepts
* **Relay Radio Sleep Timer:** The mechanism responsible for putting relay radios into a low-power sleep state, which was found to be perpetually reset by incoming packet traffic.
* **Radio Wake Time:** The duration the radio remains active per network hop, targeted for reduction to conserve battery.
* **Mesh Networks:** Distributed communication topology affected by high packet volume and corresponding wake-state [power consumption](./power-consumption.md).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-03-meshsync-battery-reply.eml` | email | Medium |

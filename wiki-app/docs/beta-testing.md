---
id: beta-testing
title: Beta Testing
tags:
  - alex-kim
  - aurora-labs
  - aurora-mira
  - aurora-nova-widget
  - beta-nps
  - beta-tester-confidentiality
  - beta-testing
  - beta-testing-program
last_updated: "2026-09-01T21:22:10.295169+00:00"
sidebar_label: Beta Testing
slug: /beta-testing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Beta Testing

## Overview
The beta testing program encompasses early-access releases, [firmware](./firmware.md) distribution, tester demographics, and compliance for [hardware](./hardware.md) and software projects, notably involving the [Aurora Nova Widget](./aurora-nova-widget.md) by [Aurora Labs](./aurora-labs.md). The program relies on structured firmware candidate batches, telemetry management, and [confidentiality](./confidentiality.md) agreements to evaluate pre-release performance and gather Net Promoter Score (NPS) metrics.

## Key Details
- **Nova Widget Beta Program:** 
  - Firmware builds are distributed in targeted batches (such as batch 3 and batch 4 retests).
  - Firmware candidate 0.3.9 addresses [MeshSync](./meshsync.md) relay [battery drain](./battery-drain.md) issues (tracked as [MESH-118](./mesh-118.md)), and users are instructed to flash before adding more than 6 nodes to a mesh.
  - Previous updates (such as firmware 0.3.8) adjusted the default read interval to 15 minutes.
- **Beta Tester Demographics & Metrics:**
  - Beta cohorts consist of compact groups (e.g., 12 recipients in batch 3, consisting of 3 farmers and hobbyists).
  - Beta NPS raw scores have reached 42, with pairing complaints notably decreasing following firmware version 0.9.3.
- **[Hardware Specifications](./hardware-specifications.md) & Safety:**
  - Devices deployed in the beta are IP54 splash-resistant only; they must not be submerged, and outdoor burial ([SenseNode SN-400](./sensenode-sn-400.md)-style) is not supported.
- **Legal & Confidentiality:**
  - Under beta agreement excerpts, beta firmware, partial MeshSync sources, and [power budget](./power-budget.md) spreadsheets are classified as confidential.
  - Telemetry remains local with optional user-configured [MQTT export](./mqtt-export.md).

## Related Entities
- **Aurora Labs:** The organization managing beta invites (`beta@auroralabs.example`) and [firmware releases](./firmware-releases.md).
- **Alex Kim:** Product team member tracking box copy, firmware compile discrepancies, and nova widget designs.
- **Jamie QA:** Quality assurance team member monitoring firmware versions, NPS metrics, and [documentation](./documentation.md) contradictions.
- **Sam Rivera:** Team lead handling shipping decisions, print errors, and shared booth negotiations.
- **[Aurora Mira](./nova-widget.md):** Contact involved in shared booth discussions.
- **[TeaBuddy](./teabuddy.md):** Fictional startup/puck demo referenced alongside the beta testing ecosystem.

## Related Concepts
- **MeshSync:** Protocol and repository (GitHub `aurora-labs/meshsync #442`) used for node [networking](./networking.md) and relay battery drain management.
- **Firmware Flashing:** Pre-deployment requirement for beta testers prior to expanding mesh networks beyond 6 nodes.
- **Beta NPS:** Satisfaction metric tracked during testing phases.

## Contradictions
&gt; **Contradiction:** Discrepancies exist regarding device operational parameters and documentation. The herbal box print proof v3 and marketing PDF state a 5-minute duration, whereas firmware configurations and compiled wiki sources indicate 7 minutes. Similarly, batch 3 documentation notes a default read interval of 15 minutes, while older PDF documentation states an hourly interval.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-06-slack-dump-product.txt` | text | Unverified |
| 2 | `emails/2026-06-10-nova-widget-beta-invite.eml` | email | Medium |
| 3 | `notes/2026-06-08-meeting-no-agenda.txt` | text | Medium |
| 4 | `samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt` | text | Unverified |
| 5 | `samples/legal/[SAMPLE]-2026-07-04-beta-tester-agreement-snippet.txt` | text | Unverified |

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
last_updated: "2026-09-02T06:38:48.201123+00:00"
sidebar_label: Beta Testing
slug: /beta-testing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Beta Testing

## Overview
The beta testing program encompasses early-stage [hardware](./hardware.md) and software evaluations for projects like the [Aurora Nova Widget](./aurora-nova-widget.md) by [Aurora Labs](./aurora-labs.md), alongside internal product quality tracking for initiatives such as [TeaBuddy](./teabuddy.md). The testing cycles focus on [firmware](./firmware.md) stability, [mesh networking](./mesh-networking.md) performance, user feedback collection (NPS), and compliance with [confidentiality](./confidentiality.md) and safety guidelines.

## Key Details
- **Nova Widget Beta Batches:** 
  - **Batch 3:** Utilizes firmware 0.3.8, with a default read interval of 15 minutes. Issues can be reported via GitHub (`aurora-labs/meshsync #442`) or support channels (see [release-notes-0.3.9.txt](../static/media/release-notes-0.3.9-b38073c1c1.txt)).
  - **Batch 4 / Firmware 0.3.9:** Addresses [MeshSync](./meshsync.md) relay [battery drain](./battery-drain.md) issues (Ticket [MESH-118](./mesh-118.md)). Testers are advised to flash the firmware before adding more than 6 nodes to a mesh network.
- **Tester Demographics:** Early beta lists typically consist of a targeted group (e.g., 12 participants, comprising 3 farmers and a remainder of hobbyists).
- **Metrics & Feedback:** Beta Net Promoter Score (NPS) has been recorded around 42, with pairing complaints notably decreasing following firmware version 0.9.3.
- **Confidentiality & Safety:** 
  - Under Section 4 of the beta agreement, beta firmware, partial MeshSync source code, and [power budget](./power-budget.md) spreadsheets are strictly confidential.
  - Devices are IP54 splash-resistant only and must not be submerged or used for outdoor burial ([SenseNode SN-400](./sensenode-sn-400.md)-style).
  - Telemetry data remains local by default, with optional user-configured [MQTT Export](./mqtt-export.md).

## Related Entities
- **Aurora Labs:** Organization managing the Nova Widget beta program (`beta@auroralabs.example`, `support@auroralabs.example`).
- **Alex Kim & Jamie QA:** Product and quality assurance team members tracking metrics, [documentation](./documentation.md), and firmware iterations.
- **TeaBuddy:** Fictional startup/product intersecting with team discussions and Maker Faire demos.
- **[Aurora Nova Widget v2](./aurora-nova-widget-v2.md):** Stakeholder involved in shared booth coordination and power number disclosures.

## Related Concepts
- **MeshSync:** Protocol and synchronization utility tested during beta phases, with specific node limits and battery drain optimizations.
- **Firmware Flashing:** Mandatory pre-test procedure required before scaling mesh network nodes beyond 6 devices.
- **Beta NPS:** Satisfaction tracking metric utilized to gauge user experience improvements across updates.

## Contradictions
&gt; **Contradiction:** Discrepancies exist regarding documentation and specifications across channels. For instance, print proofs/marketing PDFs have listed brew/operation times as 5 minutes, whereas compiled firmware and wiki updates specify 7 minutes. Similarly, older documentation referenced hourly read intervals, which were officially updated to a 15-minute default interval during Batch 3 rollouts.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-06-slack-dump-product.txt` | text | Unverified |
| 2 | `emails/2026-06-10-nova-widget-beta-invite.eml` | email | Medium |
| 3 | `notes/2026-06-08-meeting-no-agenda.txt` | text | Medium |
| 4 | `samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt` | text | Unverified |
| 5 | `samples/legal/[SAMPLE]-2026-07-04-beta-tester-agreement-snippet.txt` | text | Unverified |

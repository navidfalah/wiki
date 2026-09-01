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
last_updated: "2026-09-01T19:17:59.831606+00:00"
sidebar_label: Beta Testing
slug: /beta-testing
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Beta Testing

## Overview
Beta testing programs across projects like the [Aurora Nova Widget](./aurora-nova-widget.md) and [TeaBuddy](./teabuddy.md) involve managing [firmware releases](./firmware-releases.md), monitoring user feedback and Net Promoter Scores (NPS), coordinating participant lists, and enforcing safety and [confidentiality](./confidentiality.md) agreements. 

## Key Details
- **Aurora Nova Widget Beta Program:**
  - **Releases & Firmware:** Batch 3 testers received firmware 0.3.8 alongside a [documentation](./documentation.md) refresh (default read interval set to 15 minutes). Firmware 0.3.9 was subsequently rolled out for batch 4 retesting to address the MeshSync relay [battery drain](./battery-drain.md) issue ([MESH-118](./mesh-118.md)). Testers are advised to flash the updated firmware before adding more than 6 nodes to a mesh.
  - **Attachments:** [release-notes-0.3.9.txt](../static/media/release-notes-0.3.9-b38073c1c1.txt)
  - **Participant Demographics:** A meeting note recorded a beta tester list of 12 people, comprising 3 farmers and the rest hobbyists.
  - **Safety & [Hardware Specs](./hardware-specs.md):** Under Section 7 of the beta agreement, devices are IP54 splash-resistant only and must not be submerged or used for outdoor burial ([SenseNode SN-400](./sensenode-sn-400.md)-style). An implied decision from team discussions is to ship the IP54 beta first.
  - **Data & Telemetry:** Telemetry remains local with optional, user-configured [MQTT Export](./mqtt-export.md).
  - **Confidentiality:** Section 4 dictates that beta firmware, partial MeshSync source code, and [power budget](./power-budget.md) spreadsheets are strictly confidential.
  - **Reporting Channels:** Issues are reported via GitHub (`aurora-labs/meshsync #442`) or `support@auroralabs.example`.

- **TeaBuddy Beta Program:**
  - **Metrics:** Raw beta NPS was reported at 42, with pairing complaints decreasing following version 0.9.3.
  - **Documentation & Packaging:** Discrepancies exist between print proofs, firmware, and documentation regarding brew/operating times.

## Related Entities
- **[Aurora Labs](./aurora-labs.md):** Organization managing the Nova Widget beta program (`beta@auroralabs.example`).
- **Alex Kim & Jamie QA:** Product and QA team members tracking firmware versions, packaging copy, and beta metrics.
- **Aurora Mira:** Contact involved in shared booth coordination and internal discussions regarding power number transparency.

## Related Concepts
- **MeshSync:** Protocol/firmware component subject to battery drain fixes and multi-node mesh limits (max 6 nodes before flashing updates).
- **Beta Tester Agreements:** Legal frameworks covering confidentiality, local telemetry handling, IP54 safety limits, and non-endorsement clauses.

## Contradictions
&gt; **Contradiction:** 
&gt; - **Brew/Operation Time:** Herbal box copy in print proof v3 states "5 min", marketing PDFs state "5 min", while the wiki stated "7 min" after the last compile, matching firmware version 7.
&gt; - **Default Read Interval:** Batch 3 beta documentation specifies a default read interval of 15 minutes, explicitly overriding an old PDF that stated hourly reads.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `dummy-test/2026-07-06-slack-dump-product.txt` | text | Unverified |
| 2 | `emails/2026-06-10-nova-widget-beta-invite.eml` | email | Medium |
| 3 | `notes/2026-06-08-meeting-no-agenda.txt` | text | Medium |
| 4 | `samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt` | text | Unverified |
| 5 | `samples/legal/[SAMPLE]-2026-07-04-beta-tester-agreement-snippet.txt` | text | Unverified |

---
id: firmware-updates
title: Firmware Updates
tags:
  - aurora-labs
  - aurora-nova-widget
  - firmware-flashing
  - firmware-updates
  - meshsync-relay-battery-drain
  - read-interval
  - teabuddy
  - wiki
last_updated: "2026-09-01T19:18:45.377001+00:00"
sidebar_label: Firmware Updates
slug: /firmware-updates
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Updates

## Overview
[Firmware](./firmware.md) update releases and [beta testing](./beta-testing.md) communications for [Aurora Labs](./aurora-labs.md) [hardware](./hardware.md), specifically focusing on the [Aurora Nova Widget](./aurora-nova-widget.md) and its MeshSync capabilities. Updates are distributed to beta testers to resolve hardware and software issues, such as relay [battery drain](./battery-drain.md) and configuration adjustments.

## Key Details
- **Aurora Nova Widget [Firmware](./firmware.md) Versions:**
  - **[Release 0.3.9](./release-039.md) Candidate:** Released for batch 4 retest on June 10, 2026. This build specifically addresses the MeshSync relay battery drain reported under ticket [MESH-118](./mesh-118.md). Testers are instructed to flash this version before adding more than 6 nodes to a mesh. Associated [release notes](./release-notes.md) are available via `release-notes-0.3.9.txt`.
  - **[Firmware](./firmware.md) 0.3.8:** Distributed to batch 3 beta testers. Users were similarly advised to flash this version before adding more than 6 nodes.
- **Read Interval Configuration:** The default read interval is 15 minutes.
- **[Documentation](./documentation.md) & Support:** 
  - Official documentation is compiled on the wiki at `wiki.auroralabs.example`.
  - Issue tracking is managed via GitHub under `aurora-labs/meshsync #442` or through `support@auroralabs.example`.

## Related Entities
- **Aurora Labs:** The organization developing the Nova Widget and managing [firmware releases](./firmware-releases.md) and beta programs.
- **Aurora Nova Widget:** The primary hardware device undergoing beta [firmware](./firmware.md) testing.

## Related Concepts
- **MeshSync:** A [mesh networking](./mesh-networking.md) protocol/feature utilized by the Nova Widget, associated with node scaling limits (recommending firmware flashes past 6 nodes) and battery drain issues (addressed in version 0.3.9).
- **Firmware Flashing:** The process of updating device software prior to expanding mesh networks or deploying new configurations.
- **[TeaBuddy](./teabuddy.md):** A puck demo showcased at Maker Faire by Aurora Labs affiliates (noted as an unrelated but fun project).

## Contradictions
&gt; **Contradiction:** Documentation regarding the default read interval differs across materials. Beta communications state that the default read interval is 15 minutes, instructing users to ignore older documentation (such as an old PDF) that stated the read interval was hourly.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-10-nova-widget-beta-invite.eml` | email | Medium |
| 2 | `samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt` | text | Unverified |

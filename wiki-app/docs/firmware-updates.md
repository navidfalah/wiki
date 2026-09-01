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
last_updated: "2026-09-01T21:22:53.484536+00:00"
sidebar_label: Firmware Updates
slug: /firmware-updates
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Updates

## Overview
[Firmware](./firmware.md) update releases for devices such as the [Aurora Nova Widget](./aurora-nova-widget.md) managed by [Aurora Labs](./aurora-labs.md). These updates address critical [bug fixes](./bug-fixes.md), including [battery drain](./battery-drain.md) issues, and introduce configuration adjustments like default read intervals.

## Key Details
- **Firmware 0.3.9 Candidate:** 
  - Released for batch 4 retest.
  - Addresses the [MeshSync](./meshsync.md) relay battery drain issue reported under ticket [MESH-118](./mesh-118.md).
  - Instructions: Flash before adding more than 6 nodes to a mesh.
  - Associated attachments: [release-notes-0.3.9.txt](../static/media/release-notes-0.3.9-b38073c1c1.txt)
- **Firmware 0.3.8:**
  - Distributed to beta invite batch 3.
  - Instructions: Flash before adding more than 6 nodes.
- **Default Read Interval:** Configured to 15 minutes.

## Related Entities
- **Aurora Labs:** The organization issuing the [firmware updates](./firmware-updates.md) and [beta testing](./beta-testing.md) invitations.
- **Aurora Nova Widget:** The [hardware](./hardware.md) device receiving the firmware updates.
- **[TeaBuddy](./teabuddy.md):** Mentioned in connection with a puck demo at Maker Faire.

## Related Concepts
- **MeshSync:** Mesh network synchronization tool associated with GitHub issue #442 and ticket MESH-118.
- **[Beta Testing](./beta-testing.md):** Managed via beta tester email groups (`beta-testers@auroralabs.example`).
- **[Documentation](./documentation.md):** Compiled from raw sources and hosted on the wiki (`wiki.auroralabs.example`).

## Contradictions
&gt; **Contradiction:** Documentation regarding the default read interval contains conflicting information. Beta batch 3 communications state that the default read interval is 15 minutes, explicitly noting to "ignore old PDF saying hourly."

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-10-nova-widget-beta-invite.eml` | email | Medium |
| 2 | `samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt` | text | Unverified |

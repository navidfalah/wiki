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
last_updated: "2026-09-02T06:39:33.009280+00:00"
sidebar_label: Firmware Updates
slug: /firmware-updates
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Updates

## Overview
[Firmware](./firmware.md) update releases for the [Aurora Nova Widget](./aurora-nova-widget.md) managed by [Aurora Labs](./aurora-labs.md) introduce critical [bug fixes](./bug-fixes.md), including resolutions for [hardware](./hardware.md) relay [battery drain](./battery-drain.md) issues, alongside [documentation](./documentation.md) and default configuration updates.

## Key Details
* **Firmware 0.3.9 Candidate:** 
  * Released for the batch 4 retest.
  * Addresses the [MeshSync](./meshsync.md) relay battery drain issue tracked under ticket [MESH-118](./mesh-118.md).
  * Recommended to flash before adding more than 6 nodes to a mesh network.
  * Includes [release notes](./release-notes.md): [release-notes-0.3.9.txt](../static/media/release-notes-0.3.9-b38073c1c1.txt).
* **Firmware 0.3.8:**
  * Distributed to batch 3 beta testers.
  * Requires flashing before adding more than 6 nodes.
  * Sets the default read interval to 15 minutes.
* **Support & Reporting:**
  * Report issues to `support@auroralabs.example` or via GitHub at `aurora-labs/meshsync #442`.
  * Documentation is maintained at `wiki.auroralabs.example`.

## Related Entities
* **Aurora Labs:** Organization developing the firmware and managing the beta test batches.
* **Aurora Nova Widget:** The hardware device receiving the firmware updates.
* **[TeaBuddy](./teabuddy.md):** Mentioned as a puck demo at Maker Faire (unrelated project).

## Related Concepts
* **Firmware Flashing:** The process of updating device software prior to scaling network node counts beyond 6 nodes.
* **MeshSync:** The [mesh networking](./mesh-networking.md) protocol and utility associated with relay battery drain issues (MESH-118).
* **Read Interval:** The configured polling frequency, established at 15 minutes for current firmware versions.

## Contradictions
&gt; **Contradiction:** Beta documentation contains conflicting information regarding device read intervals. While batch 3 instructions explicitly state that the default read interval is 15 minutes and advise ignoring older PDF documentation stating an hourly interval, earlier documentation sources may still reference the hourly schedule.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `emails/2026-06-10-nova-widget-beta-invite.eml` | email | Medium |
| 2 | `samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt` | text | Unverified |

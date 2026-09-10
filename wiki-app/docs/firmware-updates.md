---
id: firmware-updates
title: Firmware Updates
tags:
  - aurora-labs
  - aurora-nova-widget
  - aurora-nova-widget-v2
  - ble-proxy-update
  - default-read-interval
  - firmware-039
  - firmware-flashing-requirement
  - firmware-updates
last_updated: "2026-09-10T14:38:13.993094+00:00"
sidebar_label: Firmware Updates
slug: /firmware-updates
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Firmware Updates

## Overview
[Firmware](./firmware.md) management for the [Aurora Nova Widget](./aurora-nova-widget.md) and [MeshSync](./meshsync.md) network involves iterative [testing](./testing.md), targeted [bug fixes](./bug-fixes.md), and structured [beta testing](./beta-testing.md).

## Key Details
- **[Firmware 0.3.9](./firmware-039.md):** Developed to address MeshSync relay [battery drain](./battery-drain.md) issues (tracked under [MESH-118](./mesh-118.md)). The fix drops the relay radio wake time from 400ms to 80ms per hop. Candidate builds entered [QA and Testing](./qa-and-testing.md) retesting in early June 2026 and rolled out to beta testers shortly after. It also includes a parent election rewrite moving up from earlier milestones.
- **Firmware 0.3.8:** Addressed earlier deployment requirements, though users still reported multi-hour silence and rejoin storms when networks exceeded 8 nodes.
- **Flashing Requirements:** Testers and users are routinely instructed to flash specific firmware versions (such as 0.3.8 or 0.3.9) before adding more than 6 nodes to a mesh network.
- **OTA Update Design:** Proposed [OTA Updates](./ota-updates.md) mechanisms (sketched by [Aurora Nova Widget v2](./aurora-nova-widget-v2.md)) feature signed firmware images using ed25519, rollback protection following mesh-wide upgrades, and [BLE](./ble.md) proxy updates via a phone app when a mesh node is unreachable. Risks include bricking if a parent node dies mid-push and MeshSync routing table invalidation during flashing.

## Related Entities
- **[Aurora Labs](./aurora-labs.md):** The organization developing the Nova Widget and [MeshSync Protocol](./meshsync-protocol.md).
- **Aurora Nova Widget / Widget v2:** The primary [hardware](./hardware.md) device undergoing firmware iterations and beta testing.
- **Key Personnel:** Jonah Park (Engineering/Relay sleep timer fixes), Lena Ito ([QA Testing](./qa-testing.md) plans), and Mira Chen (OTA design and support triage).
- **[TeaBuddy](./teabuddy.md) & [SenseNode](./sensenode.md):** Alternative or comparative ecosystem products mentioned during beta testing and support discussions regarding mesh complexity and single-device DFU.

## Related Concepts
- **MeshSync:** The local [mesh networking](./mesh-networking.md) protocol used by Nova Widgets to avoid cloud subscriptions, which introduces scaling challenges and rejoin storms at higher node counts.
- **BLE Proxy Update:** A method utilizing a smartphone application to update nodes that cannot be reached directly through the mesh network.
- **Relay Radio Sleep Timer:** A power-saving mechanism on relay nodes that previously reset on every received packet in busy meshes, leading to excessive battery drain.

## Contradictions
&gt; **Contradiction:** [Documentation](./documentation.md) regarding read intervals and power targets contains conflicting data. Beta communications state that the default read interval is 15 minutes and advise ignoring older PDF documentation that claims hourly readings. However, internal reference notes state a power target of "2 years on CR2032 with hourly readings."

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/ideas/emails/2026-06-03-meshsync-battery-reply.eml` | email | Medium |
| 2 | `notes/ideas/emails/2026-06-05-mesh-118-qa-standup-notes.eml` | email | Medium |
| 3 | `notes/ideas/emails/2026-06-10-nova-widget-beta-invite.eml` | email | Medium |
| 4 | `samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md` | text | Unverified |
| 5 | `samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt` | text | Unverified |
| 6 | `samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt` | text | Unverified |
| 7 | `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt` | text | Unverified |

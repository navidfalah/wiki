---
id: bug-reports
title: Bug Reports
tags:
  - bug-reports
  - meshfan
  - meshsync
  - mira-chen
  - parent-election
  - potato99
  - rejoin-storm
  - sensenode
last_updated: "2026-09-02T06:38:57.829293+00:00"
sidebar_label: Bug Reports
slug: /bug-reports
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Bug Reports

## Overview

This page documents active bug reports and tracking discussions for mesh synchronization software, specifically focusing on GitHub issue `#442` in the `aurora-labs/meshsync` repository concerning persistent rejoin storms on version `0.3.8`.

## Key Details

* **Issue:** GitHub Issue `#442` (`aurora-labs/meshsync`)
* **Title:** Rejoin storm persists at 8 nodes on 0.3.8
* **State:** Open
* **Labels:** bug, power, beta
* **Key Symptoms:** Users experience multi-hour silence after adding an 8th node to the network, even after flashing all units to version `0.3.8`.
* **Workaround:** Users are advised to cap their networks at a maximum of 6 nodes.
* **[Troubleshooting](./troubleshooting.md):** Users have been requested to send RSSI logs to support.
* **Resolution Status:** The `0.3.9` milestone has been moved up to address the underlying issue through a complete rewrite of the parent election logic.

## Related Entities

* **@potato99:** GitHub user who originally reported the multi-hour silence and rejoin storm issue on version `0.3.8`.
* **@[mira-chen](./aurora-nova-widget-v2.md):** Maintainer/developer responding to bug reports, requesting RSSI logs, providing workarounds, and announcing the accelerated `0.3.9` milestone and parent election rewrite.
* **@meshfan:** Community contributor noting that version `0.3.8` represents an improvement but does not fully resolve the bug, and mentioning external perceptions from [SenseNode](./sensenode-sn-400.md) users.
* **@teaguy:** GitHub user who mistakenly commented on the wrong repository while greeting `@mira-chen`.
* **SenseNode:** A competing or alternative mesh node platform whose users reportedly mock the complexity of the affected mesh system.
* **[Aurora Labs](./aurora-labs.md):** Organization maintaining the `meshsync` repository.

## Related Concepts

* **Rejoin Storm:** A network phenomenon where multiple nodes simultaneously attempt to rejoin the mesh, causing prolonged communication blackouts or multi-hour silence.
* **Parent Election:** The algorithmic process by which mesh nodes select their primary parent node for routing; currently scheduled for a complete rewrite in version `0.3.9`.
* **RSSI Logs:** Received Signal Strength Indicator logs utilized by support and developers to diagnose wireless connectivity and node participation issues.

## Contradictions

*(No contradictions identified in the current source material.)*

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt` | text | Unverified |

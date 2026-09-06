---
id: contradictions-and-paradoxes
title: Contradictions & Paradoxes
tags:
  - review
  - data-quality
last_updated: "2026-09-06T00:00:00.000000+00:00"
sidebar_label: Contradictions & Paradoxes
slug: /contradictions-and-paradoxes
---

<!-- HAND-CURATED — not written by the compiler. Built by grepping "## Contradictions"
across wiki-app/docs/*.md and grouping the recurring conflicts into themes. Recompiling
the wiki will not touch this file, but new source data can introduce contradictions
this page doesn't know about yet — see "Keeping this page current" below. -->

# Contradictions & Paradoxes

This page collects the conflicting facts the compiler has flagged across the wiki into one place, instead of leaving them scattered one `**Contradiction:**` note at a time across 100+ pages. 112 of the ~150 generated pages carry a `## Contradictions` section; roughly a third of those actually contain a flagged conflict, and they cluster into about ten recurring stories rather than 40 unrelated ones.

Worth knowing up front: the [Fictional Universe](./fictional-universe.md) page (tagged `intentional-contradictions`) confirms this whole corpus is synthetic test data, deliberately seeded with conflicts to exercise cross-linking, trust propagation, and the human review queue. So the list below is less "data quality incident report" and more a map of the planted conflicts — plus a few contradictions the compiler introduced by accident while *describing* the planted ones.

## Recurring contradiction threads

### 1. Battery chemistry: CR2450 vs. CR2032
Early blog posts, an Amazon draft, and Alex's teardown blog say the Aurora Nova Widget uses a **CR2450** cell; internal engineering docs, hardware revision C specs, and team sync transcripts say **CR2032**. CR2032 is the corrected, authoritative answer — the CR2450 mentions are acknowledged mistakes, not a live dispute. Seeded across ~30 pages, including [Nova Widget](./nova-widget.md), [Hardware Specifications](./hardware-specifications.md), [Battery Specifications](./battery-specifications.md), and [Aurora Nova Widget](./aurora-nova-widget.md).

### 2. Battery life: "2 years" (marketing) vs. ~18–22 months (engineering/teardown)
Marketing consistently claims a 2-year battery life; engineering estimates land at 18 months minimum for a 10-node mesh, and independent teardowns land around 20–22 months. [Investor Updates](./investor-updates.md) and [Product Traction](./product-traction.md) note Aurora Labs plans to resolve this by publishing an official [Power Budget](./power-budget.md) spreadsheet — as of this wiki, that hasn't closed the gap yet. Seeded across ~28 pages, including [Battery Life](./battery-life.md), [Power Budget](./power-budget.md), and [Hardware Teardowns](./hardware-teardowns.md).

### 3. Default read interval: hourly (kickoff) vs. 15 minutes (spec/firmware)
Project kickoff slides and early notes said the device reads hourly; the shipped spec and firmware default to a 15-minute interval. [Firmware Updates](./firmware-updates.md) explicitly tells beta testers to ignore the old hourly PDF. This one reads as settled in the artifacts that matter (firmware, current spec) but keeps resurfacing because older documents were never corrected. Seeded across ~34 pages, including [Documentation](./documentation.md), [MeshSync](./meshsync.md), and [Firmware Releases](./firmware-releases.md).

### 4. TeaBuddy herbal steep preset: 5:00 (marketing/print) vs. 7:00 (firmware/wiki)
Firmware v0.9.4 and the wiki fix the herbal preset at **7:00**; marketing copy, the printed box (print proof v3), and a marketing PDF still say **5:00**. [TeaBuddy](./teabuddy.md) and [Packaging & Firmware](./packaging-firmware.md) both flag that the fix only landed in firmware — the physical print materials were never corrected. See also [Product Management](./product-management.md) and [Firmware Changelog](./firmware-changelog.md).

### 5. MeshSync beta-safe node count: 8 nodes (spec fragment) vs. 6 nodes (`meshsync.h`)
The Nova Widget spec fragment says beta testing went up to 8 nodes (and was unstable there); the protocol header explicitly defines `MESHSYNC_BETA_SAFE_NODES` as **6**. See [MeshSync Protocol](./meshsync-protocol.md) and [Power Management](./power-management.md).

### 6. "Mesh always uses less power than LoRaWAN" — stale claim vs. current research
An old research-tab bookmark asserted mesh networks always beat LoRaWAN on power. Current research shows that's false once a mesh grows past ~8 nodes, due to rejoin-spike overhead. See [LoRaWAN](./lorawan.md), [Power Consumption](./power-consumption.md), and [Hardware Research](./hardware-research.md).

### 7. Competitor battery-life claim: SenseNode SN-400, 3 years (vendor) vs. ~22 months (independent teardown)
Not an internal Aurora Labs conflict — a reminder that the same marketing-vs-reality gap shows up in the competitive landscape too. See [SenseNode SN-400](./sensenode-sn-400.md), [Hardware Teardowns](./hardware-teardowns.md), and [Market Research](./market-research.md).

### 8. TeaBuddy connectivity: a joke MQTT hack vs. official BLE-only support
A community post joking that a microphone "listens for a buzz" to fake MQTT support got picked up during ingestion. Official support is clear: TeaBuddy is BLE-app-only with no MQTT support. [IoT Integrations](./iot-integrations.md) explicitly flags that the joke post "should not be ingested as a system specification" — a case where the *provenance* of a claim, not just its content, is the problem. See also [MQTT](./mqtt.md).

### 9. IP54 vs. IP67 — community opinion vs. an engineering/cost tradeoff
Community discussion frames this as "`IP67 > IP54 fight me`," but [Hardware Specifications](./hardware-specifications.md) shows it's a deliberate cost decision: an IP65/67 tooling mold was quoted at $7,850 and deferred, not an oversight. See [IoT](./iot.md).

### 10. Open disagreement: solar trickle charging (unresolved, not a data error)
[Standup Notes](./standup-notes.md) records a straightforward team split: Jonah (hardware) wants solar trickle charging, Mira (firmware/mesh) doesn't. Unlike the items above, there's no "correct" answer being obscured here — it's a live decision, not a documentation bug. See also [Power Management](./power-management.md).

## Paradoxes

A few items are less "fact A conflicts with fact B" and more self-referential or structurally odd:

- **The zombie rename.** Renaming `MeshSync` to `MeshSink` has been rejected three separate times, yet it keeps reappearing as an active backlog item every planning cycle ([Project Backlog](./project-backlog.md), [Product Naming](./product-naming.md), [Wiki Maintenance](./wiki-maintenance.md)). A decision that is simultaneously final and never final.
- **A contradiction about a contradiction.** [Market Research](./market-research.md)'s own Contradictions section garbles the battery-type conflict mid-sentence ("the official product spec table lists it as using a CR2450 versus CR2032 discrepancy") before correcting itself in a parenthetical. The page meant to document confusion and briefly generated more of it.
- **Contradictions by design.** [Fictional Universe](./fictional-universe.md) and [Compiler Testing](./compiler-testing.md) state outright that the source data "deliberately conflicts... to exercise cross-linking, analytics, and human review." So this page's headline finding — "the data disagrees with itself" — was true before a single email was ingested.
- **The same number, two meanings.** [IoT Sensors](./iot-sensors.md) has kickoff docs and independent teardowns both landing on "2 years," but from incompatible assumptions (hourly reads vs. 15-minute reads). Agreement on the label, disagreement on everything underneath it.

## Keeping this page current

This is a manual first pass at an idea already on the team's own roadmap: [Research Management](./research-management.md) and [Task Prioritization](./task-prioritization.md) both mention building "a linter to grep for `Contradiction:` blocks across documentation files." Until that exists, refresh this page by re-scanning for new or changed `## Contradictions` sections after a recompile:

```bash
grep -rl "Contradiction" wiki-app/docs/*.md
```

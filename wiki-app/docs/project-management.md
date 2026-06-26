---
id: project-management
title: Project Management
tags:
  - aurora-labs
  - teabuddy
  - sprint-management
  - backlog
  - action-items
  - meshsync
  - battery-management
  - documentation
last_updated: "2026-06-25T07:54:02.344927+00:00"
sidebar_label: Project Management
slug: /project-management
---

# Project Management

## Overview

Project management activities at [Aurora Labs](./aurora-labs.md) and [TeaBuddy](./teabuddy.md) encompass [agile sprint methodologies](./agile-sprints.md), detailed [backlog grooming](./backlog-grooming.md), issue tracking, and cross-functional collaboration. Key areas of focus include [firmware development](./firmware-development.md), hardware design, [documentation](./documentation.md), and addressing customer-facing issues. Regular standups, sprint planning, and retrospectives are conducted to manage progress, identify blockers, and prioritize tasks across various product lines like Aurora's [Nova Widget](./nova-widget.md) and [MeshSync](./meshsync.md), and TeaBuddy's mobile applications.

## Key Details

### Sprint Management & Planning

*   **Aurora Labs Sprint 14 Retro (June 16)**:
    *   **Successes**: Mesh stable at 6 nodes in the lab, wiki compiler heuristic mode functional, Nova widget enclosure pebble shape approved.
    *   **Challenges**: Documentation still incorrectly states hourly default (spec is 15 min), support ticket #1042 remained open, `index.md` not updated before a demo.
    *   **Action Items**: Implement a [contradiction linter](./contradiction-linter.md) for battery claims, publish the power budget spreadsheet, invite 3 more [beta testers](./beta-testing.md) from the homelab forum.
    *   **Shoutout**: [Mira Chen](./mira-chen.md) fixed a sleep regression bug in two hours.
    *   **Parking Lot**: TeaBuddy partnership ("smart garden tea") was unanimously rejected; renaming MeshSync to MeshSink was rejected for the 4th time.
*   **Aurora Labs Sprint 15 Planning (July 10)**:
    *   **Goal**: Stabilize 8-node mesh and publish the power budget spreadsheet.
    *   **Committed Tasks**: Mira Chen to profile rejoin spikes on an [nRF5340](./nrf5340.md) eval board; [Jonah Park](./jonah-park.md) to update the comparison page for [SenseNode](./sensenode.md) SN-400; an intern to fix the forum scrape CSS selector.
    *   **Stretch Goals**: Develop an [MQTT](./mqtt.md) export CSV sample and design an [OTA (Over-The-Air) Update](./ota-update.md) document (not implementation).
    *   **Carried Over**: Contradiction linter for battery claims, `index.md` refresh before an investor demo.
    *   **Parking Lot**: TeaBuddy co-marketing to be revisited in August; renaming MeshSync to MeshSink was rejected for the 5th time.
*   **Aurora Labs Standup (July 1)**:
    *   **Updates**: Mira Chen released 0.3.8 and is monitoring [GitHub](./github.md) for rejoin regressions. Jonah Park reported the [IP65](./ip65.md) gasket vendor quote is still $8k, with the board advising to wait. The wiki compiled with heuristic mode now has over 40 pages.
    *   **Blockers**: [Alex](./alex.md)'s blog battery typo ([CR2450](./cr2450.md) instead of [CR2032](./cr2032.md)) is still indexed; the homelab forum scrape parser is broken on nested quotes.
    *   **Wins**: Three new beta testers joined from thread #9102; TeaBuddy's Alex sent a pebble-shaped stress ball as a joke gift.
    *   **Todo**: Run the extended dummy data generator before the demo.

### Backlog & Prioritization (July 10)

*   **Aurora P0**: Publish [power budget spreadsheet](./power-budgeting.md), 0.3.9 rejoin hardening, update comparison page for SenseNode SN-400.
*   **TeaBuddy P0**: [Android v1.1 beta release](./ios-18-android-development.md), TB-142 cancel bug verification, box copy audit for all presets.
*   **Shared Icebox**: Plant Whisperer app (#47), contradiction linter, wiki index auto-refresh.
*   **Quick Wins**: Add 40 extended dummy raw files for compiler stress testing, fix forum scrape thread #9102.
*   **Stale/Rejected**: Rename MeshSync → MeshSink, KarpathyGarden product name.

### Product Development

*   **MeshSync**:
    *   Pairing is still flaky on a 3-node [mesh networking](./mesh-networking.md).
    *   Rejoin storms reproduce at 8 nodes, causing power spikes from 110µA to 340µA on parent swap.
    *   Mira Chen considers current state "fine for beta," while Jonah Park advocates for logging every rejoin with RSSI and hop count.
    *   Mesh is stable at 6 nodes in the lab.
    *   Action items include capturing a 24-hour trace on the staging mesh and comparing [nRF52840](./nrf52840.md) vs nRF5340 for the next revision.
    *   A wiki page "known mesh quirks v0.3" is planned.
    *   0.3.8 has been released, with 0.3.9 focused on rejoin hardening.
*   **Nova Widget**: Beta boards have arrived, and the pebble-shaped enclosure design was approved. It uses [UART](./uart.md) provisioning, not consumer [QR](./qr.md) flow.
*   **SenseNode**: A teardown blog indicates Aurora's [IP54](./ip54.md) rating is weak, with a target of IP65. A comparison page update for SenseNode SN-400 is a P0 item.
*   **TeaBuddy**:
    *   Android v1.1 beta is a P0 item.
    *   TB-142 cancel bug requires verification.
    *   [iOS 18 beta](./ios-18-android-development.md) changes to [CoreBluetooth](./corebluetooth.md) pairing caused ticket #2156, requiring `CBManagerAuthorization` to resolve before QR deep link triggers [GATT](./gatt.md) connect.
    *   A background steep timer bug (TB-background-kill) requires `UIBackgroundTask` renewal.
    *   A 0.9.3 fix is an action item, with documentation for Android kickoff to avoid similar ordering mistakes.
    *   The TeaBuddy team inquired about mesh syncing tea timers, which Mira Chen rejected for v1.

### Documentation & Wiki

*   The wiki compiler heuristic mode is functional and has generated over 40 pages.
*   Updates to `index.md` are required before investor demos.
*   A contradiction linter for battery claims is an action item.
*   Corrections to Alex's blog regarding battery type need to be ingested into the wiki before the next forum scrape.

### Battery Management

*   The correct battery type is CR2032, not CR2450 as stated in Alex's blog.
*   A power budget spreadsheet needs to be published.
*   Power numbers require revalidation after rejoin fixes.
*   The TeaBuddy team requested to share Aurora's battery calculator spreadsheet; permission was granted with credit, noting different chemistry due to TeaBuddy's haptic puck.

### Action Items

*   Capture a 24-hour trace on the staging mesh.
*   Compare nRF52840 vs nRF5340 for the next revision.
*   Create a wiki page: "known mesh quirks v0.3".
*   Implement a contradiction linter for battery claims.
*   Publish the power budget spreadsheet.
*   Invite 3 more beta testers from the homelab forum.
*   Revalidate power numbers after the rejoin fix.
*   Ship 0.9.3 fix for TeaBuddy iOS 18 issues.
*   Document iOS 18 pairing changes in Android kickoff.
*   Reply to a Hardware Habit comment (action item lost in corruption).

## Related Entities

*   **Mira Chen**: [Mira Chen](./mira-chen.md) Aurora Labs team member, involved in firmware, bug fixes, and sprint planning.
*   **Jonah Park**: [Jonah Park](./jonah-park.md) Aurora Labs team member, involved in MeshSync, hardware comparisons, and product design.
*   **Alex**: [Alex](./alex.md) Author of a blog post with incorrect battery information; TeaBuddy team member.
*   **Sam Rivera**: [Sam Rivera](./sam-rivera.md) TeaBuddy author of iOS 18 CoreBluetooth pairing research notes.
*   **Aurora Labs**: [Aurora Labs](./aurora-labs.md) Primary company, developing MeshSync and Nova Widget.
*   **TeaBuddy**: [TeaBuddy](./teabuddy.md) Partner company, developing Android/iOS apps and smart home products.
*   **SenseNode**: [SenseNode](./sensenode.md) Competitor product (SN-400) used for comparison.

## Related Concepts

*   **Agile Sprints**: [Agile Sprints](./agile-sprints.md) Structured periods of work with defined goals, planning, and retrospectives.
*   **Backlog Grooming**: [Backlog Grooming](./backlog-grooming.md) The process of reviewing, refining, and prioritizing items in the product backlog.
*   **Firmware Development**: [Firmware Development](./firmware-development.md) Software embedded in hardware devices, critical for MeshSync functionality.
*   **Mesh Networking**: [Mesh Networking](./mesh-networking.md) A network topology where devices connect directly, dynamically, and non-hierarchically to as many other nodes as possible.
*   **BLE (Bluetooth Low Energy)**: [BLE (Bluetooth Low Energy)](./ble.md) Wireless technology used for short-range communication, relevant to TeaBuddy's pairing.
*   **iOS 18 / Android Development**: [iOS 18 / Android Development](./ios-18-android-development.md) Mobile operating system platforms for TeaBuddy applications.
*   **IP Rating (Ingress Protection)**: [IP Rating (Ingress Protection)](./ip-rating.md) Standard for defining levels of sealing effectiveness of electrical enclosures against intrusion from foreign bodies and moisture.
*   **Power Budgeting**: [Power Budgeting](./power-budgeting.md) Calculating and managing the power consumption of electronic devices.
*   **Documentation**: [Documentation](./documentation.md) Creation and maintenance of technical and user-facing content.
*   **Contradiction Linter**: [Contradiction Linter](./contradiction-linter.md) A tool or process to identify conflicting information within documentation or specifications.
*   **Beta Testing**: [Beta Testing](./beta-testing.md) Releasing pre-production software/hardware to a group of users for real-world testing.
*   **OTA (Over-The-Air) Update**: [OTA (Over-The-Air) Update](./ota-update.md) Wireless delivery of new software or firmware to devices.

## Contradictions

*   **Documentation vs. Specification for Default Interval**:
    **Contradiction:** The product specification states a 15-minute default interval, but kickoff slides and existing documentation incorrectly mention an hourly default. This discrepancy has been noted by Mira Chen and Jonah Park on multiple occasions (June 5, June 19).
*   **Marketing vs. Engineering Battery Life Claims**:
    **Contradiction:** Marketing materials suggest a battery life of two years, while engineering aims for a minimum of eighteen months at ten nodes. This highlights a gap between promotional claims and technical feasibility (June 5, June 19).
*   **Blog vs. Actual Battery Type**:
    **Contradiction:** Alex's blog incorrectly states the battery type as CR2450, whereas the actual battery used is CR2032. This typo is a known blocker and requires correction in the wiki (June 19, July 1).
*   **Current vs. Target IP Rating**:
    **Contradiction:** A SenseNode teardown blog suggests Aurora's current [IP54](./ip54.md) rating is weak, while Aurora Labs is pursuing an IP65 rating for improved ingress protection, indicating a gap between current product resilience and desired standards (Slack dump, July 1).

## Sources

*   `notes/TEST-slack-dump.txt`
*   `samples/ideas/[SAMPLE]-2026-07-10-backlog-grooming-snippet.txt`
*   `samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt`
*   `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt`
*   `samples/notes/[SAMPLE]-2026-07-01-aurora-standup.txt`
*   `samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt`
*   `samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md`
*   `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt`
*   `transcripts/2026-06-05-sync-fragment.txt`

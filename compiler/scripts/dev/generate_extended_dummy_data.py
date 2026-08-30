#!/usr/bin/env python3
"""Generate wave-2 [SAMPLE] and [DUMMY TEST DATA] raw files for LLM Wiki pipeline testing."""

from __future__ import annotations

from pathlib import Path

RAW_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "raw"

# 42 new files — Aurora Labs + TeaBuddy + cross-domain, mixed formats/lengths
EXTENDED_FILES: dict[str, str] = {
    # ── dummy-test/ (TeaBuddy + Aurora operational docs) ─────────────────────
    "dummy-test/2026-07-01-firmware-changelog.md": """# [DUMMY TEST DATA] TeaBuddy firmware changelog — v0.9.x series

> **Label:** Fictional test file. Safe to delete. Tags: TeaBuddy, BLE, firmware.

## v0.9.4 (2026-07-01)

- Fix TB-142: timer continues after cancel in app (Sam Rivera)
- Increase BLE pairing timeout to 45s for iOS 18 beta
- Herbal preset constant aligned to 7:00 (was 5:00 in marketing copy — **CONTRADICTION** fixed in firmware only)

## v0.9.3 (2026-06-28)

- CoreBluetooth permission prompt order fix (ticket #2156)
- Haptic motor duty cycle capped at 70% per Alex Kim UX review

## v0.9.2 (2026-06-20)

- TestFlight build; box QR pairing path
- CR2032 sleep draw reduced 12µA → 9µA

## Cross-references

- Aurora Nova Widget uses MeshSync — **not shared codebase**
- See support ticket #2156, beta feedback snippets, slack dump engineering
""",
    "dummy-test/2026-07-02-aurora-meshsync-release-notes.md": """# [DUMMY TEST DATA] MeshSync firmware 0.3.8 — release notes

> **Label:** Fictional Aurora Labs release. Tags: MeshSync, Nova Widget, rejoin.

**Release date:** 2026-07-02  
**Owners:** Mira Chen (firmware), Jonah Park (QA sign-off)

## Highlights

- Rejoin storm mitigation when mesh exceeds 6 nodes (known issue since beta)
- Parent election logging: RSSI + hop count exported via debug UART
- Power spike on rejoin reduced 340µA → 180µA (still above 110µA target)

## Breaking changes

- Default read interval remains **15 minutes** (NOT hourly — kickoff slides were wrong)
- MQTT export schema v2 (optional, local broker only)

## Known issues

- 8+ nodes still unstable in field reports (ticket #2099)
- Battery life: engineering 18mo @ 10 nodes; marketing may still say 2yr

## TeaBuddy mention

Sam Rivera asked if MeshSync could sync tea timers — **out of scope for Aurora v1**.
""",
    "dummy-test/2026-07-03-qa-test-matrix-teabuddy.txt": """[DUMMY TEST DATA] TeaBuddy QA test matrix — beta build 0.9.4

Owner: Jamie Lo
Tags: TeaBuddy, QA, BLE, CR2032

PAIRING
[PASS] QR scan → BLE connect iOS 17.4
[PASS] QR scan → BLE connect iOS 18 beta (after 0.9.3 fix)
[FAIL] Android — N/A v1
[BLOCK] Pairing with airplane mode toggle mid-flow — TB-201

TIMERS
[PASS] Green 3:00 ±0.5s
[PASS] Black 5:00 ±0.5s
[PASS] Herbal 7:00 — verify box label updated
[FAIL] Custom 0:59 rounds to 1:00 — TB-198
[PASS] Cancel mid-steep stops haptic

HARDWARE
[PASS] LED green pulse visible in dim room
[FAIL] Buzz audible over dishwasher — TB-19 (known)
[PASS] CR2032 swap without re-pair

CROSS-PRODUCT
[NOTE] Tester #12 also owns Aurora Nova Widget — two apps, no conflict reported
""",
    "dummy-test/2026-07-04-investor-update-draft.txt": """[DUMMY TEST DATA] Aurora Labs — investor update draft (DO NOT SEND)

Date: 2026-07-04
Author: Mira Chen (CEO voice, draft)

Traction:
- 47 beta Nova Widget units in field
- MeshSync 0.3.8 shipped; rejoin fix unblocks 8-node deployments
- Wiki compiler demo impressed seed investor (karpathy pattern mention)

Challenges:
- IP65 tooling $8k deferred; shipping IP54 beta with clear splash-resistance language
- SenseNode SN-400 still wins outdoor waterproof narrative (IP67)
- Docs contradiction: battery claims 2yr vs 18mo — publishing power budget spreadsheet Q3

TeaBuddy tangent:
- Alex Kim reached out re: co-marketing at Maker Faire — deferred until Aurora beta ships
- No firmware merge; shared CR2032 supply chain joke only

Ask: $500k bridge for injection mold + 2 FTE firmware
""",
    "dummy-test/2026-07-05-teabuddy-packaging-brief.md": """# [DUMMY TEST DATA] TeaBuddy packaging brief — v1 retail box

> Tags: TeaBuddy, packaging, CR2032, QR pairing

**Owner:** Alex Kim  
**Date:** 2026-07-05

## Box contents

1. TeaBuddy Puck (sage green silicone rim)
2. CR2032 pre-installed
3. Quick-start card with QR code
4. No USB cable (battery-only v1)

## Copy requirements

- "Local-only. No account required."
- Preset times on box MUST match app: green 3 / black 5 / herbal 7
- **Do not** mention Aurora Labs or MeshSync on packaging

## Open issues

- Haptic "quiet in kitchen" complaint — consider insert card tip: "place puck on saucer"
- Competitor reference: SenseNode unboxing slick — borrow tray layout idea only

## Success metric

Unboxing → first successful steep in <5 min (95th percentile)
""",
    "dummy-test/2026-07-06-slack-dump-product.txt": """[DUMMY TEST DATA — TeaBuddy fictional startup — Slack #product export 2026-07-06]

#product · exported for wiki ingest test

alex.kim  10:01 AM
herbal box copy still says 5 min in print proof v3. killing me.

jamie.qa  10:03 AM
firmware is 7. marketing PDF is 5. wiki says 7 after last compile. CONTRADICTION flag when?

alex.kim  10:05 AM
@sam.rivera can we ship with sticker overlay?

sam.rivera  10:07 AM
no. fix print. also aurora mira pinged about shared booth — still no from me unless they pay half

alex.kim  10:12 AM
nova widget pebble shape is cute. different universe. focus.

jamie.qa  10:15 AM
beta NPS raw: 42. pairing complaints down after 0.9.3.

alex.kim  10:18 AM
update dummy-test folder after next compile run pls
""",
    "dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt": """[DUMMY TEST DATA] Power budget working notes — Aurora Nova Widget

Author: Mira Chen
Tags: CR2032, MeshSync, power, Nova Widget

Assumptions:
- CR2032 nominal 220mAh (not 240 — datasheet variance)
- Read interval: 15 min (spec authoritative)
- Mesh size: 10 nodes (stress case)

| State | Current | Duty | Daily mAh |
|-------|---------|------|-----------|
| Sleep | 4.2 µA | 99.7% | 0.10 |
| Sample+TX | 12 mA | 0.03% | 0.05 |
| Rejoin spike | 180 µA avg | 0.01% | 0.04 |

Total ~0.19 mAh/day → ~18 months (engineering claim)

Marketing slide "2 years" assumes 6 nodes + optimistic cell + hourly reads (WRONG interval)

TeaBuddy puck comparison (Sam's numbers): ~0.35 mAh/day @ 5 steeps — 12mo target plausible
""",
    "dummy-test/2026-07-08-customer-onboarding-faq.md": """# [DUMMY TEST DATA] Aurora Nova Widget — beta onboarding FAQ

> Tags: Nova Widget, MeshSync, SenseNode, support

## How many sensors can I add?

Beta recommendation: **6 nodes** until MeshSync 0.3.9. Eight or more may cause rejoin loops (see ticket #2099).

## What's the default reading interval?

**15 minutes.** Some older docs say hourly — that was a kickoff mistake.

## Is it waterproof?

IP54: splash resistant. Not submersible. SenseNode SN-400 offers IP67 if you need outdoor submersion.

## Battery type?

CR2032. Some blog posts incorrectly said CR2450 — corrected in wiki.

## Does this work with TeaBuddy?

No. Different product, different company, different app. Both are "local-first" philosophically.
""",
    # ── samples/notes ───────────────────────────────────────────────────────
    "samples/notes/[SAMPLE]-2026-07-01-aurora-standup.txt": """[SAMPLE] Aurora Labs standup — July 1

mira: 0.3.8 out. watching github issues for rejoin regressions
jonah: gasket vendor quote IP65 still $8k — board said wait
me: compiled wiki with heuristic mode — 40+ pages now??

blockers:
- alex blog battery typo still indexed somewhere (CR2450)
- homelab forum scrape parser broken on nested quotes

wins:
- 3 new beta testers from thread #9102
- teabuddy alex sent pebble-shaped stress ball joke gift

todo: run extended dummy data generator before demo
""",
    "samples/notes/[SAMPLE]-2026-07-03-whiteboard-photo-transcription.txt": """[SAMPLE] Whiteboard photo transcription — Aurora lab (July 3)

ILLEGIBLE CORNER: "PARENT? CHILD?"

CLEAR SECTION — mesh topology:
  [GW?] --- node A --- node B
              |           |
            node C      node D

ARROW: "rejoin storm here when D drops"

CLEAR SECTION — battery:
  CR2032 × 1
  "18mo @ 10 nodes" circled three times
  "2yr marketing" crossed out

STICKY NOTE (jonah): "pebble not hex"

STICKY NOTE (mira): "teabuddy asked about timer sync — NO"

PHONE NUMBER SCRIBBLE: blurred — ignore
""",
    "samples/notes/[SAMPLE]-2026-07-05-lunch-and-learn-notes.txt": """[SAMPLE] Lunch-and-learn notes — "Local-first IoT" (July 5)

Presenter: Alex Kim (TeaBuddy, invited guest at Aurora office)

Topics:
- BLE vs mesh tradeoffs for consumer gadgets
- Why TeaBuddy rejected cloud accounts for v1
- Demo: puck buzzer vs Nova Widget LED patterns

Q&A highlights:
- Mira: "Mesh complexity is worth it at 6+ garden sensors"
- Alex: "Tea drinkers want one device one job"
- Jonah: "Could share enclosure supplier contacts"

Action: add cross-link wiki page teabuddy-cross-ref (already exists?)
""",
    "samples/notes/[SAMPLE]-2026-07-08-vendor-email-gasket.txt": """[SAMPLE] Vendor email — gasket tolerances follow-up

From: injection.molder@vendor.example
To: jonah.park@auroralabs.example
Subject: IP65 tooling quote revision

Jonah,

Revised quote $7,850 for IP65 seal tooling. Lead time 6 weeks.
IP54 current tool adequate for beta batch 500 units.

Recommend silicone gasket durometer 50A per your drawing rev C.

Unrelated: your colleague Alex Kim asked about small-batch silicone rings for a "tea puck" — same material? We can combine shipping.

Regards,
Pat (vendor)

---
Internal: do NOT cc TeaBuddy vendor threads into Aurora wiki ingest without redaction
""",
    "samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt": """[SAMPLE] Sprint 15 planning — Aurora Labs (July 10)

Sprint goal: stabilize 8-node mesh + publish power budget

Committed:
- Mira: rejoin spike profiling on nRF5340 eval board
- Jonah: comparison page update vs SenseNode SN-400
- Intern: fix forum scrape CSS selector

Stretch:
- MQTT export CSV sample
- OTA update design doc (not implement)

Carried over:
- Contradiction linter for battery claims
- index.md refresh before investor demo

Parking lot:
- TeaBuddy co-marketing — revisit August
- Rename MeshSync → MeshSink — NO (5th rejection)
""",
    # ── samples/articles ─────────────────────────────────────────────────────
    "samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md": """# [SAMPLE] MQTT export schema — Nova Widget (optional local)

**Status:** Draft v2  
**Owner:** Mira Chen  
**Tags:** MeshSync, Nova Widget, MQTT

## Overview

Optional local MQTT export. No cloud required. Compatible with Home Assistant hobbyist setups.

## Topic structure

```
aurora/{device_id}/telemetry
aurora/{device_id}/battery
aurora/{device_id}/mesh/neighbors
```

## Payload example

```json
{
  "soil_moisture_pct": 42,
  "temp_c": 19.2,
  "read_interval_min": 15,
  "battery_mv": 2980,
  "mesh_hops": 2
}
```

## Non-goals

- TeaBuddy steep events (different product)
- Cloud broker hosting by Aurora Labs

## Contradiction note

Kickoff slides showed hourly export batching — spec is 15 min per reading cycle.
""",
    "samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md": """# [SAMPLE] OTA update design sketch — Nova Widget

**Author:** Mira Chen  
**Date:** 2026-07-04  
**Status:** NOT SHIPPING IN BETA

## Requirements

- Signed firmware images (ed25519)
- Rollback protection after mesh-wide upgrade
- BLE proxy update via phone app when mesh node unreachable

## Risks

- Brick scenario if parent node dies mid-push
- MeshSync routing table invalidation during flash

## TeaBuddy note

Sam Rivera uses simpler single-device BLE DFU — offered to share test harness. Aurora deferred.

## Open question

Should OTA require explicit user consent per node or batch "update all"?
""",
    "samples/articles/[SAMPLE]-2026-07-06-teabuddy-v11-roadmap.md": """# [SAMPLE] TeaBuddy v1.1 roadmap — internal

**Date:** 2026-07-06  
**Owner:** Alex Kim  
**Tags:** TeaBuddy, Android, BLE

## Theme: reach + polish

| Feature | Priority | Notes |
|---------|----------|-------|
| Android app | P0 | Kotlin, same BLE protocol |
| Multiple pucks | P1 | TB-88 epic |
| Steep history CSV | P2 | local export only |
| Dark mode | P2 | app only |
| Temperature probe | OUT | v2 hardware |

## Non-goals (v1.1)

- MeshSync / Aurora integration
- Cloud accounts
- Smart kettle APIs

## Dependencies

- Firmware 1.0.0 stable branch
- Fix herbal preset marketing alignment (see packaging brief)

## Success metrics

Android parity with iOS pairing success >93%
""",
    "samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md": """# [SAMPLE] Home Assistant integration — Nova Widget community guide

**Author:** community contributor (unofficial)  
**Scraped for wiki test:** 2026-07-08

## Prerequisites

- MeshSync 0.3.8+
- Local MQTT broker (Mosquitto)
- Aurora MQTT schema v2

## Quick start

1. Enable MQTT export in device settings ( UART command `mqtt on` until app support)
2. Subscribe to `aurora/+/telemetry`
3. Map soil moisture to `%` entity

## Known quirks

- Rejoin events flood logs at 8 nodes — filter `mesh/neighbors` topic
- Default interval 15 min — do not use hourly automation templates from old blog posts

## TeaBuddy

No official integration. Community hack: microphone listens for buzz — **joke post, do not ingest as spec**
""",
    "samples/articles/[SAMPLE]-2026-07-09-competitive-landscape-q3.md": """# [SAMPLE] Competitive landscape Q3 2026 — Aurora internal

**Author:** Jonah Park  
**Tags:** SenseNode, Nova Widget, market

## Garden / soil sensors

| Vendor | Product | Mesh | Cloud | Waterproof | Battery |
|--------|---------|------|-------|------------|---------|
| Aurora Labs | Nova Widget | MeshSync | optional | IP54 | CR2032 |
| SenseNode | SN-400 | LoRaWAN | required | IP67 | CR2450 |
| CheapoCo | SoilStick | WiFi | required | none | USB |

## Kitchen / lifestyle (adjacent)

| Vendor | Product | Protocol | Notes |
|--------|---------|----------|-------|
| TeaBuddy | Puck | BLE | local-only tea timer |
| TimerCap | KS failed 2024 | mechanical | not smart |

## Battlecard updates

- SenseNode: emphasize subscription cost over 3 years
- TeaBuddy: not competitor — partnership/co-marketing only

## Contradiction watch

Our Amazon draft said CR2450 — fix before publish
""",
    "samples/articles/[SAMPLE]-2026-07-11-wiki-compiler-heuristic-notes.md": """# [SAMPLE] Wiki compiler — heuristic mode notes

**Context:** LLM Wiki pipeline test artifact  
**Tags:** wiki, compiler, karpathy pattern

## What heuristic mode does

- Reads all `.txt` and `.md` under `data/raw/`
- Extracts topics without LLM API key
- Generates Docusaurus pages under `wiki-app/docs/`
- Builds cross-links from entity mentions (Nova Widget, TeaBuddy, MeshSync, etc.)

## Test data layout

- `data/raw/samples/` — [SAMPLE] prefixed files
- `data/raw/dummy-test/` — [DUMMY TEST DATA] labeled files
- Original junk data from `generate_junk_data.py`

## Known ingest quirks

- Broken markdown exports test parser resilience
- Forum HTML scrapes lose nested content
- Email threads include wrong-thread noise

## Goal

40+ raw files → rich graph with contradictions surfaced (battery, herbal preset, read interval)
""",
    # ── samples/transcripts ──────────────────────────────────────────────────
    "samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt": """[SAMPLE] Investor call transcript fragment — Aurora Labs (July 2)

INVESTOR: Walk me through the moat against SenseNode.

MIRA CHEN: Local mesh without subscription. Open firmware partial. Community integrations.

INVESTOR: Battery life claims?

MIRA: Engineering eighteen months at ten nodes, fifteen minute reads. Marketing rounds to two years — we're publishing the spreadsheet.

INVESTOR: Eight-node mesh issue?

MIRA: Mitigated in 0.3.8. Recommend six for beta customers.

JONAH PARK: IP54 beta, IP65 when tooling funded.

INVESTOR: TeaBuddy partnership?

MIRA: Co-marketing only. Alex is friends. No merge.

[fragment ends — recorder battery died]
""",
    "samples/transcripts/[SAMPLE]-2026-07-07-teabuddy-android-kickoff.txt": """[SAMPLE] TeaBuddy Android kickoff — transcript (July 7)

ALEX KIM: v1.1 centers Android. iOS stays parity feature-wise.

SAM RIVERA: BLE GATT identical. Kotlin coroutines for timeout handling.

JAMIE LO: QA needs 12 device matrix — Pixel, Samsung, OnePlus.

ALEX: Timeline eight weeks. Firmware frozen at 1.0.0 except bugfixes.

SAM: Aurora MeshSync folks keep asking to share codebase — still no.

JAMIE: Herbal preset box sticker shipped?

ALEX: Print vendor fixed. Seven minutes everywhere.

SAM: Action: update dummy-test packaging brief in wiki after compile.

[END — 22 min]
""",
    "samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt": """[SAMPLE] Support training roleplay — Aurora + TeaBuddy cross-ticket (July 9)

TRAINER: Customer owns both Nova Widget and TeaBuddy puck. One app request.

TRAINEE: Different companies. Nova uses MeshSync garden app. TeaBuddy uses BLE kitchen app.

TRAINER: Good. Customer cites SenseNode waterproof.

TRAINEE: IP67 vs our IP54. Recommend cover. Link comparison page.

TRAINER: Ticket #2099 rejoin loop?

TRAINEE: Known issue. Update to 0.3.8. Stay at six nodes.

TRAINER: TeaBuddy pairing iOS 18?

TRAINEE: Fixed 0.9.3. Long-press reset for TB-142 cancel bug.

TRAINER: Customer mentions CR2450 blog typo?

TRAINEE: We use CR2032. Wiki corrected. Alex blog updated.
""",
    "samples/transcripts/[SAMPLE]-2026-07-11-podcast-outline-unrecorded.txt": """[SAMPLE] Podcast outline — "Local-first gadgets" (never recorded)

Hosts: Alex Kim (TeaBuddy), Mira Chen (Aurora Labs)
Planned date: 2026-07-11 — cancelled due to travel

SEGMENT 1: Why no cloud account for v1?
- TeaBuddy: steep timer privacy theater vs real need
- Aurora: mesh data stays on LAN

SEGMENT 2: Battery myths
- CR2032 in both products — different duty cycles
- Contradiction: 2yr vs 18mo marketing

SEGMENT 3: When mesh beats BLE
- Garden scale, multiple sensors
- Kitchen single-device — BLE wins

SEGMENT 4: SenseNode elephant in room
- Subscription fatigue
- IP67 envy

CTA: link wiki demo with graph view

[STATUS: unrecorded — reschedule TBD]
""",
    # ── samples/ideas ──────────────────────────────────────────────────────────
    "samples/ideas/[SAMPLE]-2026-07-04-wiki-automation-ideas.txt": """[SAMPLE] Wiki automation ideas — July 4 dump

1. Pre-commit hook: grep raw files for CONTRADICTION marker
2. Auto-ingest slack exports from dummy-test/ folder
3. Graph diff between compiles — show new entities
4. LLM summarize support tickets into FAQ pages
5. Orphan page linter (already on backlog #1)

CROSS-PRODUCT:
6. Shared glossary: CR2032, BLE, MeshSync, steep preset
7. Unified "local-first manifesto" page — Aurora + TeaBuddy quotes

REJECTED:
8. Single app for both products — CEOs said no
9. Mesh tea timer — jonah said "absolutely not"

REFERENCE: karpathy llm wiki pattern, docusaurus graph plugin
""",
    "samples/ideas/[SAMPLE]-2026-07-08-maker-faire-booth-plan.txt": """[SAMPLE] Maker Faire Portland booth plan — joint Aurora × TeaBuddy (draft)

Budget: $4k split
Booth size: 10x10

Aurora side:
- Live 6-node mesh demo (NOT 8 — lesson learned)
- Nova Widget pebble enclosures on display
- Handout: power budget QR → wiki page

TeaBuddy side:
- Steep demo bar (herbal 7 min samples)
- Puck pairing live on iPad
- Handout: "no cloud account" sticker

Shared banner: "Gadgets that respect your LAN"

Risks:
- Brand confusion — separate table colors (green tea / brown soil)
- Mira travel conflict — maybe Jonah only

Decision: pending August revisit (see partnership memo)
""",
    "samples/ideas/[SAMPLE]-2026-07-10-backlog-grooming-snippet.txt": """[SAMPLE] Backlog grooming snippet — mixed products (July 10)

AURORA P0:
- Publish power budget spreadsheet
- 0.3.9 rejoin hardening
- Comparison page SenseNode SN-400

TEABUDDY P0:
- Android v1.1 beta
- TB-142 cancel bug verification
- Box copy audit all presets

SHARED ICEBOX:
- Plant Whisperer app (#47)
- Contradiction linter
- Wiki index auto-refresh

QUICK WINS:
- Add 40 extended dummy raw files for compiler stress test
- Forum scrape fix thread #9102

STALE:
- Rename MeshSync → MeshSink (reject again)
- KarpathyGarden product name (reject again)
""",
    # ── samples/support ────────────────────────────────────────────────────────
    "samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt": """[SAMPLE] Support ticket #2201 — battery documentation wrong

Status: CLOSED  
Product: Aurora Nova Widget  
Customer: blog reader (not beta)

---

CUSTOMER (2026-07-01):
Alex's teardown blog listed CR2450. Your spec says CR2032. Which is correct?

AGENT (Mira):
CR2032 is correct. Blog corrected 2026-06-20. Wiki page updated.

CUSTOMER:
Marketing still says 2 year battery. Forum says 18 months.

AGENT:
Depends on node count and read interval (15 min default). Power budget doc publishing soon.

CUSTOMER:
Ok. Also unrelated — does TeaBuddy share the app?

AGENT:
No. Different product and company.

---
Tags: CR2032, battery, contradiction
""",
    "samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt": """[SAMPLE] Support ticket #2210 — MQTT Home Assistant setup

Status: RESOLVED  
Product: Aurora Nova Widget v2 beta  
Customer: homelab (same as thread #9102)

---

CUSTOMER:
Enabled MQTT export. Getting duplicate messages during rejoin storms.

AGENT:
Known on 0.3.7. Upgrade 0.3.8. Filter neighbors topic. Limit to 6 nodes.

CUSTOMER:
Schema v1 or v2?

AGENT:
v2 required for 0.3.8+. See mqtt-export-schema sample doc.

CUSTOMER:
Works. Side note: wife wants TeaBuddy for kitchen — different MQTT?

AGENT:
TeaBuddy has no MQTT. BLE app only.

---
Related: homelab integration guide (community)
""",
    "samples/support/[SAMPLE]-2026-07-06-ticket-TB-301-android-waitlist.txt": """[SAMPLE] Support ticket TB-301 — Android waitlist inquiry

Status: OPEN (FAQ candidate)  
Product: TeaBuddy Puck  
Customer: redacted

---

CUSTOMER (2026-07-06):
When Android? iOS user switching phones.

AGENT (Alex Kim draft):
v1.1 targeting September 2026. Waitlist at teabuddy.example/android

CUSTOMER:
Will presets sync from iOS?

AGENT:
Local only. No cloud sync v1.1. Re-pair on new phone exports CSV optional v1.1.

CUSTOMER:
I have Aurora garden sensors. One app?

AGENT:
Not planned. MeshSync vs BLE different stacks.

---
Escalation: add to v11 roadmap FAQ
""",
    "samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt": """[SAMPLE] Support ticket #2222 — waterproof confusion vs SenseNode

Status: OPEN  
Product: Aurora Nova Widget  
Customer: gardener (Pacific NW)

---

CUSTOMER:
Installed in raised bed. Rain killed unit #3. SenseNode neighbor fine.

AGENT (Jonah internal):
IP54 not IP67. Recommend cover. Comparison page update in sprint 15.

CUSTOMER:
Why not IP67 like SenseNode?

AGENT (draft):
Cost/tooling tradeoff. Beta focus local mesh + open export. IP65 roadmap.

CUSTOMER:
What about TeaBuddy puck — waterproof?

AGENT:
TeaBuddy is splash-resistant kitchen use. Different product.

---
Related: #1042, competitor SN-400
""",
    # ── samples/forums ─────────────────────────────────────────────────────────
    "samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt": """[SAMPLE] GitHub issue scrape — aurora-labs/meshsync #442

Title: Rejoin storm persists at 8 nodes on 0.3.8
State: open
Labels: bug, power, beta

@potato99 (2026-07-03):
Still seeing multi-hour silence after adding 8th node. 0.3.8 flashed all units.

@mira-chen (2026-07-03):
Thanks — RSSI logs to support@ please. Workaround: cap at 6 nodes.

@meshfan (2026-07-04):
0.3.8 better but not fixed. SenseNode user laughing at mesh complexity.

@teaguy (2026-07-04):
wrong repo lol but hi mira

@mira-chen (2026-07-05):
0.3.9 milestone moved up. Parent election rewrite.

[scrape truncated — 47 comments omitted]
""",
    "samples/forums/[SAMPLE]-2026-07-07-discord-local-iot-snippet.txt": """[SAMPLE] Discord #local-iot snippet scrape — July 7

UserSoil: aurora nova mqtt v2 any good?

UserHA: works if you stay 6 nodes. rejoin drama at 8.

UserTea: teabuddy puck cute. no mqtt tho.

UserSoil: CR2032 in both? battery life?

UserHA: nova ~18mo engineering claim. teabuddy ~12mo @ 5 steeps/day.

UserSkeptic: still cheaper to use phone timer

UserTea: haptic when phone in other room 🤷

UserSoil: sensenode ip67 wins rain

UserHA: subscription tax ugh

[parser lost emoji reactions]
""",
    "samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt": """[SAMPLE] Hacker News thread scrape — "Show HN: Local mesh soil sensor"

Posted: 2026-07-10
Points: 142

@dang: duplicate of May thread?

OP (mirachen): Nova Widget beta — MeshSync, optional MQTT, no mandatory cloud

comment @hardwarefan: battery math?

OP: CR2032, 15min reads, spreadsheet soon

comment @cloudbro: why not just wifi

OP: LAN-first, lower duty cycle

comment @teafan: saw teabuddy at faire — same team?

OP: friends, different company

comment @sensenode: IP67 > IP54 fight me

OP: fair for submersion use case

[scrape cut — "load more comments" button not followed]
""",
    # ── samples/emails (new category) ──────────────────────────────────────────
    "samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt": """[SAMPLE] Email — beta invite batch #3 (Aurora Nova Widget)

From: beta@auroralabs.example
To: [12 recipients]
Subject: Nova Widget beta — firmware 0.3.8 + docs refresh

Welcome to batch 3!

Please flash 0.3.8 before adding more than 6 nodes.
Default read interval: 15 minutes (ignore old PDF saying hourly).

Docs: wiki.auroralabs.example (compiled from raw sources)

Report issues: GitHub aurora-labs/meshsync #442 or support@

P.S. TeaBuddy puck demo at Maker Faire — unrelated but fun

---
[DUMMY TEST DATA — fictional recipients]
""",
    "samples/emails/[SAMPLE]-2026-07-05-teabuddy-press-pitch.txt": """[SAMPLE] Email — TeaBuddy press pitch (draft, not sent)

From: alex.kim@teabuddy.example
To: gadget-blog@example
Subject: EMBARGO 7/15 — TeaBuddy puck local-only tea timer

Hi,

TeaBuddy Puck launches beta August 2026. BLE timer on cup rim. No cloud account.

Different from garden sensors (Aurora Nova Widget uses mesh — we're BLE kitchen).

Key specs: CR2032, 3 presets (3/5/7 min), iOS now Android v1.1.

Happy to send review unit. QR pairing demo attached.

Alex Kim, CEO TeaBuddy

---
Internal note: verify herbal 7 min before any press send
""",
    "samples/emails/[SAMPLE]-2026-07-08-legal-review-trademark.txt": """[SAMPLE] Email — trademark review request

From: legal@auroralabs.example
To: mira.chen@auroralabs.example, alex.kim@teabuddy.example
Subject: SHARED COUNSEL — MeshSync vs TeaBuddy marks

Mira / Alex,

Preliminary clearance:
- MeshSync: ok with caveat on similar mesh IoT marks
- TeaBuddy: ok in class 21 kitchen gadgets
- "Puck" alone: crowded — use TeaBuddy Puck together

Avoid:
- "SteepSync" (Alex — already rejected internally)
- "Nova" alone conflicts with existing tech mark — use Nova Widget

Co-marketing OK if logos separated 24px minimum.

Regards,
Outside counsel (fictional)

---
[DUMMY TEST DATA]
""",
    "samples/emails/[SAMPLE]-2026-07-11-supply-chain-cr2032.txt": """[SAMPLE] Email — CR2032 supply chain alert

From: ops@auroralabs.example
To: jonah.park@auroralabs.example, sam.rivera@teabuddy.example
Subject: Battery cell lead times — shared order?

Jonah / Sam,

Vendor lead time CR2032 8 weeks if we combine 10k order.
Aurora need 6k, TeaBuddy need 4k for beta.

Same Panasonic part number. Ship to separate warehouses.

Reply by Friday.

Ops

---
Cross-link: power budget notes, puck firmware changelog
""",
    # ── samples/research (new category) ────────────────────────────────────────
    "samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md": """# [SAMPLE] Research notes — iOS 18 CoreBluetooth pairing changes

**Author:** Sam Rivera (TeaBuddy)  
**Tags:** BLE, iOS 18, pairing

## Summary

iOS 18 beta changed permission prompt order — caused TeaBuddy ticket #2156.

## Findings

- `CBManagerAuthorization` must resolve before QR deep link triggers GATT connect
- Background steep timer needs `UIBackgroundTask` renewal — TB-background-kill bug

## Aurora relevance

Minimal — Nova Widget uses UART provisioning not consumer QR flow.

## Action items

- Ship 0.9.3 fix
- Document in Android kickoff — avoid same ordering mistake

## Sources

- Apple beta release notes (fragment)
- Internal TestFlight crash logs
""",
    "samples/research/[SAMPLE]-2026-07-04-soil-probe-corrosion-study.txt": """[SAMPLE] Research snippet — capacitive soil probe corrosion (forum compile)

Source: HomeLab Sensors thread + PDF fragment
Tags: Nova Widget, hardware, SenseNode

Key points:
- Cheap probes fail 6–9 months in acidic soil
- SenseNode SN-400 uses coated probe — replacement $12
- Aurora beta probe: gold-flashed PCB — untested long-term

Jonah note: mention in comparison page under total cost of ownership

Mira note: not v1 blocker — document in hardware page

Unrelated tab still open: teabuddy haptic driver comparison
""",
    "samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md": """# [SAMPLE] Research — LoRaWAN vs MeshSync power comparison (rough)

**Author:** Mira Chen  
**Date:** 2026-07-06

## Assumptions

- 10 sensor nodes, one gateway
- 15 minute sample interval

## LoRaWAN (SenseNode-class)

- Duty cycle limits in EU — longer effective interval or higher peak power
- Gateway always-on ~2W wall power

## MeshSync (Aurora)

- CR2032 per node
- Rejoin spikes hurt at scale — 0.3.8 improved not solved

## Conclusion slide draft

"Mesh wins on TCO without subscription + no gateway wall wart"

## Contradiction

Old research tab bookmark said mesh always lower power — **false at 8+ nodes today**
""",
    "samples/research/[SAMPLE]-2026-07-09-tea-steep-chemistry-snippet.txt": """# [SAMPLE] Research snippet — tea steep time chemistry (TeaBuddy content marketing)

**Author:** Alex Kim  
**Tags:** TeaBuddy, herbal preset, marketing

## Key facts for copy

- Green tea: 2–3 min typical — we use 3:00
- Black tea: 3–5 min — we use 5:00
- Herbal/tisane: 5–7 min — we use **7:00** (NOT 5 — box error fixed July)

## Contradiction source

Early kickoff said herbal 5 min for "simplicity" — rejected by tea advisor.

## Competitor

TimerCap mechanical dial — no science, just gears

## Aurora overlap

None — except shared wiki compile demo mentions both preset tables
""",
    # ── samples/specs (new category) ───────────────────────────────────────────
    "samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md": """# [SAMPLE] Nova Widget — hardware revision C spec (fragment)

**Rev:** C  
**Date:** 2026-07-03  
**Tags:** Nova Widget, CR2032, IP54

## Mechanical

- Enclosure: PETG beta, pebble shape (Jonah)
- Gasket: silicone 50A, IP54 splash
- IP65 tooled variant deferred ($7,850 quote)

## Electrical

- MCU: nRF52840
- Battery: **CR2032** holder rev C fixes rattle
- Probe: capacitive soil, 30mm length

## Labels

- Do NOT print CR2450 — previous misprint caused ticket #2201

## Firmware baseline

MeshSync 0.3.8, 15 min default interval
""",
    "samples/specs/[SAMPLE]-2026-07-05-teabuddy-ble-gatt-profile.md": """# [SAMPLE] TeaBuddy — BLE GATT profile v1

**Owner:** Sam Rivera  
**Tags:** TeaBuddy, BLE, GATT

## Services

| UUID | Name |
|------|------|
| 0xTB01 | Steep Service |
| 0xTB02 | Device Info |

## Characteristics

- `PRESET_SELECT` — enum green/black/herbal/custom
- `STEEP_DURATION_SEC` — uint16, custom mode
- `STEEP_STATE` — idle/running/complete
- `HAPTIC_LEVEL` — 0–100 (cap 70 default)

## Pairing flow

1. Scan QR → deep link
2. App requests BLE permission **before** connect (iOS 18 fix)
3. GATT discover → write preset → start

## Non-goals

- MeshSync service UUID — rejected joke from April Fools spec
""",
    "samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt": """[SAMPLE] MeshSync protocol header — v0.3 (excerpt)

FILE: meshsync.h (generated wiki test excerpt)
TAGS: MeshSync, Aurora, protocol

#define MESHSYNC_MAX_NODES 32
#define MESHSYNC_BETA_SAFE_NODES 6
#define MESHSYNC_DEFAULT_INTERVAL_MIN 15

typedef enum {
  MESHSYNC_ROLE_PARENT,
  MESHSYNC_ROLE_CHILD,
  MESHSYNC_ROLE_LOST /* rejoin storm state */
} meshsync_role_t;

/* Parent election: RSSI-weighted random backoff — see whiteboard July 3 */

/* NOTE: hourly interval deprecated — use MESHSYNC_DEFAULT_INTERVAL_MIN */

/* TeaBuddy integration request denied — see partnership memo */
""",
    # ── samples/legal (new category) ───────────────────────────────────────────
    "samples/legal/[SAMPLE]-2026-07-04-beta-tester-agreement-snippet.txt": """[SAMPLE] Beta tester agreement — excerpt (Aurora Nova Widget)

[DUMMY TEST DATA — not real legal]

Section 4 — Confidentiality
Beta firmware, MeshSync source partial, and power budget spreadsheets are confidential.

Section 7 — Safety
Device is IP54 splash-resistant only. Do not submerge. SenseNode-style outdoor burial not supported.

Section 9 — Data
Telemetry stays local. Optional MQTT export user-configured.

Section 12 — No endorsement
Beta tester may mention TeaBuddy or other products — no implied Aurora partnership.

Signature: _____________ Date: _______
""",
    "samples/legal/[SAMPLE]-2026-07-06-teabuddy-privacy-policy-draft.md": """# [SAMPLE] TeaBuddy privacy policy — v1 draft

**Status:** Draft for soft beta  
**Tags:** TeaBuddy, privacy, local-first

## What we collect

Nothing required for v1 core function. No cloud account.

## What stays on device

- Steep presets and custom timers
- Pairing keys in iOS Keychain

## What we do NOT do

- Sell steep history
- Integrate Aurora MeshSync telemetry
- Require email for puck use

## Analytics

Optional opt-in crash logs TestFlight only.

## Contact

privacy@teabuddy.example (fictional)

## Contradiction check

Kickoff once suggested optional cloud sync — **removed from v1 scope**
""",
    # ── samples/social (new category) ──────────────────────────────────────────
    "samples/social/[SAMPLE]-2026-07-02-twitter-thread-scrape.txt": """[SAMPLE] Twitter/X thread scrape — @AuroraLabs (July 2)

@AuroraLabs: MeshSync 0.3.8 is live. Rejoin fixes, MQTT schema v2. Docs on wiki.

@hardwarefan: still 6 nodes max?

@AuroraLabs: recommend 6 for beta. 8 improving.

@TeaBuddyHQ: congrats! separate kitchen universe here 🍵

@AuroraLabs: 😊 see you at Maker Faire?

@gardeningbob: CR2032 or CR2450?

@AuroraLabs: CR2032. old blog typo fixed.

[scrape missing image alt text attachments]
""",
    "samples/social/[SAMPLE]-2026-07-08-teabuddy-instagram-caption-draft.txt": """[SAMPLE] Instagram caption draft — TeaBuddy (July 8)

[DUMMY TEST DATA — not posted]

Photo: sage green puck on ceramic mug

Caption:
Steep on time, every time ⏱️🍵
No cloud. No account. Just BLE + a gentle buzz.
Green 3 · Black 5 · Herbal 7 — finally all matching the box 😅

#TeaBuddy #LocalFirst #CR2032Club

Comment thread plan:
- Reply Android questions with v1.1 link
- Ignore "just use Siri timer" trolls
- Shout out Aurora friends at faire — no mesh jokes before coffee
""",
}


def generate_extended_dummy_data(
    raw_dir: Path | None = None,
    *,
    overwrite: bool = False,
) -> list[Path]:
    """Write wave-2 files under data/raw/. Returns paths written."""
    target = raw_dir or RAW_DIR
    target.mkdir(parents=True, exist_ok=True)

    written: list[Path] = []
    for rel_path, content in EXTENDED_FILES.items():
        out = target / rel_path
        out.parent.mkdir(parents=True, exist_ok=True)

        if out.exists() and not overwrite:
            print(f"  skip (exists): {rel_path}")
            continue

        out.write_text(content.strip() + "\n", encoding="utf-8")
        written.append(out)
        print(f"  wrote: {rel_path}")

    return written


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(
        description=f"Generate {len(EXTENDED_FILES)} wave-2 dummy raw files in data/raw/"
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace files that already exist",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=RAW_DIR,
        help=f"Raw root directory (default: {RAW_DIR})",
    )
    args = parser.parse_args()

    print(f"Generating extended dummy data → {args.output.resolve()}")
    paths = generate_extended_dummy_data(args.output, overwrite=args.overwrite)
    print(f"Done — {len(paths)} file(s) written ({len(EXTENDED_FILES)} total defined).")


if __name__ == "__main__":
    main()

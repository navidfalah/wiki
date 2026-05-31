#!/usr/bin/env python3
"""Generate a large batch of [SAMPLE] raw files for LLM Wiki pipeline testing."""

from __future__ import annotations

from pathlib import Path

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
SAMPLES_DIR = RAW_DIR / "samples"

# 20 new files — Aurora Labs + TeaBuddy, mixed formats
BULK_FILES: dict[str, str] = {
    "notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt": """[SAMPLE] MeshSync debug session — Mira + Jonah, June 12

rejoin storm at 8 nodes still reproduces
- spike 110µA → 340µA on parent swap
- mira: "fine for beta" (again)
- jonah: log every rejoin with RSSI + hop count

whiteboard photo illegible but says:
  PARENT? CHILD? WHO DECIDES???

action items (maybe):
[ ] capture 24h trace on staging mesh
[ ] compare nRF52840 vs nRF5340 for next rev
[ ] wiki page: "known mesh quirks v0.3"

random: teabuddy team asked if mesh could sync tea timers across house
mira: "absolutely not v1"
""",
    "notes/[SAMPLE]-2026-06-14-teabuddy-standup.txt": """[SAMPLE] TeaBuddy standup — June 14

sam: BLE pairing fails on iOS 18 beta — investigating
alex: steep timer drift 1.2s over 7min herbal preset — unacceptable
jamie: QA matrix 47 cases, 3 blocked on firmware

blockers:
- puck buzzer too quiet in open kitchen
- LED green pulse looks "cheap" per alex

wins:
- TestFlight build 0.9.2 approved
- box QR pairing works 11/12 in office test

mention: aurora labs offered co-marketing at maker faire?? alex skeptical
""",
    "notes/[SAMPLE]-2026-06-15-email-thread-reply-all.txt": """[SAMPLE] Email thread — RE: RE: FWD: Beta enclosure samples (DO NOT REPLY ALL)

From: jonah.park@auroralabs.example
To: mira.chen@auroralabs.example, team@auroralabs.example
Subject: RE: gasket tolerances

Mira — IP54 sample batch 3 looks acceptable. IP65 still needs $8k tool.
Can we ship beta with "splash resistant" language only?

---
From: mira.chen@auroralabs.example
To: everyone (+ accidental vendor)
Subject: RE: RE: gasket tolerances

Jonah please stop reply-all to the injection molder.

Also: competitor teardown blog updated battery — we owe Alex a correction note.

---
From: alex.kim@teabuddy.example (WRONG THREAD?)
Subject: RE: puck haptic motor

Sorry wrong thread. Ignore.

---
[thread continues off-screen — 47 messages about lunch]
""",
    "notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt": """[SAMPLE] Sprint retro — Aurora Labs, Sprint 14

Went well:
+ mesh stable at 6 nodes in lab
+ wiki compiler heuristic mode works without API key
+ nova widget enclosure pebble shape approved (jonah won)

Didn't go well:
- docs still say hourly default (spec says 15 min) — AGAIN
- support ticket #1042 still open
- nobody updated index.md before demo

Action items:
1. contradiction linter for battery claims
2. publish power budget spreadsheet
3. invite 3 more beta testers from homelab forum

Shoutout: Mira fixed sleep regression in 2 hours

Parking lot:
- TeaBuddy partnership? "smart garden tea" — rejected unanimously
- rename MeshSync → MeshSink — rejected 4th time
""",
    "articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md": """# [SAMPLE] Nova Widget — spec fragment (incomplete export)

**Product:** Aurora Nova Widget v2 beta unit  
**Owners:** Mira Chen (firmware), Jonah Park (hardware)  
**Status:** Draft — missing sections 4–7

## Overview

Open-source soil moisture + temp sensor. MeshSync local mesh, no mandatory cloud.

## Power budget (DRAFT)

| Mode | Current | Notes |
|------|---------|-------|
| Sleep | 4.2 µA | target |
| Sample + TX | 12 mA peak | 15 min interval |
| Rejoin spike | **110–340 µA** | KNOWN ISSUE |

Battery: CR2032 × 1. Marketing claims 2yr; engineering says 18mo @ 10 nodes.

## MeshSync

- Max 32 nodes (theoretical)
- Beta tested to 8 (unstable)
- Parent election: ??? (see whiteboard)

## Missing sections

- [ ] Enclosure IP rating final
- [ ] OTA update path
- [ ] MQTT export schema

## Cross-links (manual)

See also: SenseNode SN-400 competitor comparison, TeaBuddy unrelated but mentioned in kickoff.
""",
    "articles/[SAMPLE]-2026-06-13-teabuddy-kickoff-brief.md": """# [SAMPLE] TeaBuddy Puck — kickoff brief (fictional)

**Date:** 2026-06-13  
**Attendees:** Sam Rivera, Alex Kim, Jamie Lo  
**Product:** TeaBuddy smart tea puck + iOS companion

## Problem

People over-steep tea. Timers on phones get ignored when phone is in another room.

## Solution

BLE puck on cup rim. Haptic + LED when steep completes. Local-only, no cloud.

## v1 scope

- 3 presets + custom timer
- CR2032 battery, 6mo target life
- iOS only; Android v1.1

## Non-goals

- Temperature probe
- Smart kettle integration
- Aurora MeshSync (explicitly out)

## Open questions

1. Ceramic bell sound patent risk?
2. Box QR vs in-app discovery for pairing
3. Should we mention Aurora Labs as inspiration for "open hardware" story?

## Success metrics

| Metric | Target |
|--------|--------|
| Pairing success | >95% |
| Timer accuracy | ±1s |
| Beta NPS | ≥40 |
""",
    "articles/[SAMPLE]-2026-06-17-broken-markdown-export.md": """# [SAMPLE] Broken markdown export — wiki migration attempt

**Source:** Notion export gone wrong  
**Date:** 2026-06-17

## Nova Widget notes

- MeshSync is the mesh protocol
- Default read interval: 15 minutes<!-- was hourly in kickoff?? -->

### Battery

The device uses CR2032. Some docs say CR2450 — **WRONG**.

| Field | Value |
|-------|-------|
| Sleep | 4.2 µA
| TX | 12 mA

Missing closing pipe above ^^^

## TeaBuddy cross-ref

TeaBuddy uses BLE not mesh. Sam Rivera says don't merge codebases.

### Unclosed bold **this line never ends

Random HTML: <div class="notion-block">SenseNode IP67 better waterproof</div>

[link to nowhere](https://example.invalid/404)

---

```python
def broken_fence(
    # missing close
""",
    "articles/[SAMPLE]-2026-06-18-competitor-sensenode-notes.md": """# [SAMPLE] Competitor notes — SenseNode SN-400

**Author:** Mira Chen (internal only)  
**Date:** 2026-06-18

## Summary

SenseNode SN-400 is Aurora Nova Widget's main hobbyist competitor.

## Strengths

- IP67 waterproof (vs our IP54 beta)
- Polished mobile app with cloud history
- Strong Amazon reviews (4.6★)

## Weaknesses

- Subscription for export ($4/mo)
- Closed firmware
- LoRaWAN gateway required ($89)

## Feature matrix

| Feature | Nova Widget | SenseNode SN-400 |
|---------|-------------|------------------|
| Local mesh | MeshSync ✓ | ✗ |
| Cloud optional | ✓ | ✗ (required for alerts) |
| Battery | CR2032 | CR2450 |
| Open source | partial | ✗ |

## Sales battlecard snippet

Customer: "Neighbor has SenseNode, never had rain issues."

Response: IP54 resists splash not submersion. Recommend cover. Optional MQTT export without subscription.

## TeaBuddy angle

Different category but Alex Kim asked for "premium packaging reference" — SenseNode unboxing is slick.
""",
    "transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt": """[SAMPLE] [TRANSCRIPT — weekly sync fragment, June 19]

MIRA CHEN: The fifteen minute default is in the spec. Kickoff slides said hourly.

JONAH PARK: Marketing can say two years. Engineering wants eighteen months minimum at ten nodes.

MIRA: Alex's blog had the wrong battery. CR2450. We use two-oh-three-two.

JONAH: We should ingest that correction into the wiki before the next forum scrape.

UNKNOWN: (dog barking)

MIRA: TeaBuddy team asked about sharing our battery calculator spreadsheet.

JONAH: Sure if they credit us. Different chemistry though — puck draws more on haptic.

MIRA: Action item — revalidate power numbers after rejoin fix.

[recording stopped — storage full]
""",
    "transcripts/[SAMPLE]-2026-06-20-teabuddy-user-interview.txt": """[SAMPLE] User interview #7 — TeaBuddy beta (fictional)

Interviewer: Alex Kim  
Participant: "Pat" (home tea enthusiast, Portland)

ALEX: Walk me through your last steep session.

PAT: I scanned the QR, paired fine. Green tea, three minutes. Phone was in living room, puck buzzed — I heard it through the wall. Good.

ALEX: Any failures?

PAT: Once the timer kept running after I cancelled in app. Had to power-cycle puck.

ALEX: Would you pay $49?

PAT: Maybe $39. I also have an Aurora soil sensor for tomatoes — different thing but same "nice hardware" vibe.

ALEX: Nova Widget?

PAT: Yeah the little pebble. Mesh thing is over my head but soil data is fun.

[END — 34 min total, only excerpt transcribed]
""",
    "transcripts/[SAMPLE]-2026-06-21-voice-memo-sam-rivera.txt": """[SAMPLE] Voice memo — Sam Rivera, auto-transcribed (low confidence)

"okay firmware zero point nine three — pairing timeout increased to thirty seconds"

"alex wants stronger haptic — motor driver limit is three volts don't exceed"

"steep timer must survive background — iOS killed us twice use background task API"

"do not rename teabuddy again it's fine"

"mesh sync mesh sync — that's aurora not us stop mixing codebases"

"contradiction in spec herbal preset seven minutes marketing says five — fix wiki"

[inaudible — kettle boiling]

"end memo"
""",
    "ideas/[SAMPLE]-2026-06-22-cross-product-ideas.txt": """[SAMPLE] Cross-product idea dump — Aurora × TeaBuddy (mostly rejected)

IDEA A: "GardenTea" — soil moisture triggers herbal preset reminder
Status: REJECTED (mira: scope creep)

IDEA B: Shared BLE stack library
Status: MAYBE (sam + mira to sync Q3)

IDEA C: Co-branded maker faire booth
Status: PENDING (jonah interested, alex skeptical)

IDEA D: Wiki compiles both product lines into one graph
Status: YES — that's this repo

IDEA E: Nova Widget LED shows tea timer countdown
Status: REJECTED (jonah: "no")

IDEA F: Plant Whisperer app from grocery list notes
Status: backlog #47

Shower thought: linter that greps for "Contradiction:" blocks across all raw files
""",
    "ideas/[SAMPLE]-2026-06-23-naming-brainstorm-teabuddy.txt": """[SAMPLE] Naming brainstorm — TeaBuddy variants (DO NOT SEND)

KEEP:
- TeaBuddy ✓
- Puck ✓

REJECTED:
- SteepSync
- BrewNode
- CupPing
- MeshTea (confusing with MeshSync)
- KarpathyKettle (???)

Taglines tried:
- "Steep with confidence" — ok
- "Your cup, your countdown" — meh
- "Haptic tea for phone-absent humans" — too long

Aurora naming war continues: jonah wants pebble, mira wants hex for Nova Widget.
""",
    "ideas/[SAMPLE]-2026-06-24-research-tabs-dump.txt": """[SAMPLE] Research tabs dump — June 24 (mental bookmark chaos)

Open tabs:
- nRF52840 mesh rejoin power profile (PDF)
- capacitive soil probe corrosion forum thread
- teabuddy competitor "TimerCap" kickstarter
- karpathy gist llm wiki pattern
- docusaurus graph view plugin
- cr2032 vs cr2450 discharge curves
- iOS 18 CoreBluetooth breaking changes???
- aurora labs nova widget teardown (Alex's blog)

Sentence starters never finished:
- If mesh rejoin spikes persist then we should
- The contradiction between marketing 2yr and engineering 18mo suggests
- TeaBuddy haptic driver could share abstraction with

Bookmark: compare lorawan duty cycle vs mesh when less tired
""",
    "dummy-test/[SAMPLE]-2026-06-25-teabuddy-beta-feedback.md": """# [SAMPLE] TeaBuddy beta feedback snippets (fictional)

**Source:** Typeform export, 50 respondents  
**Compiled:** 2026-06-25

## Positive

> "Pairing was smoother than my Aurora sensor." — Tester #12

> "Green preset perfect. I forget less." — Tester #31

> "Love that there's no account." — Tester #8

## Negative

> "Buzz too quiet when dishwasher running." — Tester #19

> "Herbal preset says 7 min in app, box says 5." — Tester #44 **CONTRADICTION**

> "Wanted Android." — Tester #3 (expected)

## Feature requests

- Steep history export (CSV)
- Multiple pucks one app
- Dark mode (app)

## Internal note — Jamie Lo

Cross-check herbal preset docs vs firmware constants before public beta.
""",
    "dummy-test/[SAMPLE]-2026-06-26-aurora-teabuddy-partnership.txt": """[SAMPLE] Internal memo — Aurora / TeaBuddy partnership exploration

From: ops@auroralabs.example  
To: leadership (fictional)  
Date: 2026-06-26

## Context

TeaBuddy team (5 people, pre-seed) reached out after Maker Faire Portland.

## Overlap

- Both use CR2032 in v1 hardware
- Both target "local-first" narrative
- Shared investors? No.

## Proposal on table

- Co-marketing blog: "Local devices that respect your data"
- Shared booth split $2k
- NOT merging firmware or apps

## Risks

- Brand confusion (garden vs kitchen)
- Support ticket routing nightmare
- Wiki already mixes both — fine for demos, messy for customers

## Decision

Defer until Aurora beta ships. Revisit August.

Mira Chen: "Focus on mesh."  
Alex Kim: "Happy to lend puck for soil moisture April Fools joke only."
""",
    "support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt": """[SAMPLE] Support ticket #2099 — MeshSync rejoin loop

Status: OPEN  
Product: Aurora Nova Widget v2 beta  
Customer: redacted (homelab enthusiast)

---

CUSTOMER (2026-06-27 09:14):
After adding 8th node, whole mesh stops reporting for hours. Power cycle fixes temporarily.

AGENT (internal note — Mira):
Known issue. Rejoin spike. ETA fix in 0.3.8 firmware.

CUSTOMER (2026-06-27 11:02):
Neighbor's SenseNode handles 10 devices fine. Why mesh?

AGENT (draft):
MeshSync avoids cloud subscription. Tradeoff is complexity at scale. Recommend staying at 6 nodes until patch.

INTERNAL — Jonah:
Add to comparison page? "SenseNode: simpler topology, subscription."

---

Related: ticket #1042 (waterproof), ticket #2101 (battery math docs wrong)
""",
    "support/[SAMPLE]-2026-06-28-ticket-2156-teabuddy-pairing.txt": """[SAMPLE] Support ticket #2156 — TeaBuddy pairing failure iOS 18

Status: IN PROGRESS  
Product: TeaBuddy Puck v0.9.2  
Customer: redacted

---

CUSTOMER:
QR scan works but BLE never connects on iPhone 15, iOS 18 beta.

AGENT (Sam Rivera):
Reproduced. CoreBluetooth permission prompt order wrong. Fix in 0.9.3.

CUSTOMER:
Also timer ran after cancel once.

AGENT:
Known bug TB-142. Workaround: long-press puck 5s to reset session.

CUSTOMER:
I have Aurora Nova sensors — wish one app for both.

AGENT (draft never sent):
Different companies, different apps. TeaBuddy local-only by design.

---

Escalation: Alex Kim wants FAQ entry before TestFlight public
""",
    "forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt": """[SAMPLE] Scraped forum HTML — HomeLab Sensors thread #9102

<div class="thread-title">Aurora Nova vs SenseNode — real world?</div>

<div class="post user="potato99" date="2026-06-29">
anyone running 8+ nova widgets on meshsync? my rejoin issues match <a href="/thread/8821">thread 8821</a>
</div>

<div class="post user="meshfan" date="2026-06-29">
stay at 6 nodes until 0.3.8 drops. mira posted on github issues.
</div>

<div class="post user="teaguy" date="2026-06-29">
off topic but teabuddy puck at maker faire was cute. wrong forum lol
</div>

<div class="post user="random" date="2026-06-29">
sensenode ip67 wins for outdoor. nova wins for no subscription.
</div>

<!-- scrape cut off — CSS selector .post-content wrong -->
<div class="post user="potato99" date="2026-06-29">
battery life: alex blog says cr2450 but teardown shows cr2032???
""",
    "forums/[SAMPLE]-2026-06-30-teabuddy-reddit-thread-scrape.txt": """[SAMPLE] Scraped Reddit — r/tea / r/homeautomation crosspost

Title: TeaBuddy puck — BLE tea timer, no cloud [Kickstarter soon?]

u/steep_master (2026-06-30):
Saw demo at maker faire. Pairs via QR. Green tea 3min was accurate.

u/gadget_skeptic:
How is this different from a $5 phone timer?

u/steep_master:
Haptic on the cup. Phone in other room.

u/aurora_fan:
Same team as Nova Widget? Mesh when?

u/teabuddy_throwaway (OP account?):
Different company. No mesh. Local only.

u/soil_nerd:
I use Aurora Nova for garden. TeaBuddy for kitchen. Two apps fine.

[scraped mid-thread — reddit old.reddit layout broke parser]

u/gadget_skeptic:
Android?

u/steep_master:
v1.1 per FAQ sketch
""",
}



DUMMY_PREFIX = "[DUMMY TEST DATA]"
DUMMY_SUBDIRS = (
    "bulk",
    "dummy-test",
    "notes",
    "transcripts",
    "specs",
    "emails",
    "samples/bulk",
)

PEOPLE = (
    "Mira Chen",
    "Jonah Park",
    "Sam Rivera",
    "Alex Kim",
    "Jamie Lo",
    "Elena Voss",
    "Priya Nair",
    "Marcus Webb",
    "Tina Okonkwo",
)
PRODUCTS = (
    "Nova Widget",
    "MeshSync",
    "TeaBuddy Puck",
    "SenseNode SN-400",
    "GreenGrid Hub",
    "PulsePatch wearable",
    "Aurora Soil API",
)
COMPANIES = (
    ("Aurora Labs", "aurora", "IoT mesh sensors"),
    ("TeaBuddy", "teabuddy", "BLE tea timers"),
    ("Nova Health", "nova-health", "clinical wearables"),
    ("GreenGrid Energy", "greengrid", "home energy mesh"),
)
DOC_KINDS = (
    ("meeting-notes", "notes", "txt", "standup / planning"),
    ("spec-draft", "specs", "md", "product spec fragment"),
    ("email-thread", "emails", "txt", "internal email"),
    ("research-dump", "bulk", "txt", "research tabs dump"),
    ("retro", "notes", "md", "sprint retro"),
    ("support-ticket", "transcripts", "txt", "support transcript"),
    ("partner-memo", "dummy-test", "md", "partnership exploration"),
    ("forum-scrape", "bulk", "txt", "scraped forum thread"),
)


def _dummy_body(
    company: str,
    slug: str,
    kind_label: str,
    person_a: str,
    person_b: str,
    product: str,
    seq: int,
    day: int,
) -> str:
    date = f"2026-07-{day:02d}"
    other = "SenseNode SN-400" if product != "SenseNode SN-400" else "Nova Widget"
    return f"""{DUMMY_PREFIX} — {company} — {kind_label} ({date})

**Company:** {company}
**Doc kind:** {kind_label}
**Date:** {date}
**Seq:** {seq:03d}
**Owners:** {person_a}, {person_b}
**Primary product:** {product}

## Summary

Fictional pipeline test document for wiki compiler cross-linking. Recurring entities:
{person_a}, {person_b}, {product}, {other}, MeshSync, TeaBuddy Puck.

## Body

- {person_a}: rejoin spike still 110–340 µA on parent swap; log RSSI + hop count.
- {person_b}: compares {product} to {other}; subscription vs local-only debate.
- Action: update wiki power budget before beta; fix hourly vs 15-minute contradiction.
- Cross-ref: Aurora Labs ↔ TeaBuddy ↔ Nova Health ↔ GreenGrid Energy (same fictional universe).

## Open items

1. Pairing / mesh stability ticket TB-{2000 + seq}
2. Enclosure IP rating language for splash-resistant beta
3. Do not merge TeaBuddy BLE stack with MeshSync firmware

## Tags (manual)

mesh, battery, teabuddy, nova-widget, greengrid, pulsepatch, dummy-regression-{seq:03d}
"""


def generate_procedural_dummy_test_data(
    raw_dir: Path | None = None,
    *,
    count: int = 85,
    overwrite: bool = False,
    start_seq: int = 1,
    only_subdir: str | None = None,
) -> list[Path]:
    """Write [DUMMY TEST DATA] files under data/raw/ subdirs. Returns paths written."""
    root = raw_dir or RAW_DIR
    subdirs = [only_subdir] if only_subdir else list(DUMMY_SUBDIRS)
    for sub in subdirs:
        (root / sub).mkdir(parents=True, exist_ok=True)

    kinds_pool = [k for k in DOC_KINDS if k[1] == only_subdir] if only_subdir else list(DOC_KINDS)

    written: list[Path] = []
    n = max(1, count)
    for i in range(n):
        seq = start_seq + i
        company_name, slug, tagline = COMPANIES[i % len(COMPANIES)]
        kind_slug, subdir, ext, kind_label = kinds_pool[i % len(kinds_pool)]
        person_a = PEOPLE[i % len(PEOPLE)]
        person_b = PEOPLE[(i + 3) % len(PEOPLE)]
        product = PRODUCTS[(i + seq) % len(PRODUCTS)]
        day = 1 + (i % 28)
        rel = f"{subdir}/[DUMMY-TEST-DATA]-{slug}-{kind_slug}-{seq:03d}-2026-07-{day:02d}.{ext}"
        out = root / rel
        if out.exists() and not overwrite:
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(
            _dummy_body(company_name, slug, kind_label, person_a, person_b, product, seq, day).strip()
            + "\n",
            encoding="utf-8",
        )
        written.append(out)
    return written


def generate_bulk_dummy_data(
    raw_dir: Path | None = None,
    *,
    overwrite: bool = False,
) -> list[Path]:
    """Write [SAMPLE] bulk files under data/raw/samples/. Returns paths written."""
    target = (raw_dir or RAW_DIR) / "samples"
    target.mkdir(parents=True, exist_ok=True)

    written: list[Path] = []
    for rel_path, content in BULK_FILES.items():
        out = target / rel_path
        out.parent.mkdir(parents=True, exist_ok=True)

        if out.exists() and not overwrite:
            print(f"  skip (exists): samples/{rel_path}")
            continue

        out.write_text(content.strip() + "\n", encoding="utf-8")
        written.append(out)
        print(f"  wrote: samples/{rel_path}")

    return written


def main() -> None:
    import argparse

    from generate_varied_dummy_data import VARIED_DIR, generate_varied_dummy_data

    default_varied_root = RAW_DIR
    parser = argparse.ArgumentParser(
        description="Generate [SAMPLE] and [DUMMY TEST DATA] raw files under data/raw/"
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace files that already exist",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output directory (default: data/raw/ or varied-samples/ with --varied-only)",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=None,
        help="Files to generate (default: 85 procedural, 35 varied)",
    )
    parser.add_argument(
        "--min-bytes",
        type=int,
        default=3000,
        help="Minimum bytes per file for --varied-only (default: 3000)",
    )
    parser.add_argument(
        "--max-bytes",
        type=int,
        default=12000,
        help="Maximum bytes per file for --varied-only (default: 12000)",
    )
    parser.add_argument(
        "--samples-only",
        action="store_true",
        help="Only write legacy [SAMPLE] files under samples/",
    )
    parser.add_argument(
        "--dummy-only",
        action="store_true",
        help="Only write procedural [DUMMY TEST DATA] files",
    )
    parser.add_argument(
        "--varied-only",
        action="store_true",
        help="Only write large varied [DUMMY TEST DATA] files (multi-KB, diverse types)",
    )
    parser.add_argument(
        "--only-subdir",
        type=str,
        default=None,
        help="Write procedural files only under this data/raw/ subdir (e.g. bulk)",
    )
    parser.add_argument(
        "--start-seq",
        type=int,
        default=1,
        help="First sequence number for procedural files (default: 1)",
    )
    args = parser.parse_args()

    if args.varied_only:
        out = args.output or default_varied_root
        # Accept either data/raw or data/raw/varied-samples as --output
        raw_root = out.parent if out.name == VARIED_DIR else out
        count = args.count if args.count is not None else 35
        print(f"Generating large varied {DUMMY_PREFIX} → {(raw_root / VARIED_DIR).resolve()}")
        varied_paths = generate_varied_dummy_data(
            raw_root,
            count=count,
            min_bytes=args.min_bytes,
            max_bytes=args.max_bytes,
            overwrite=args.overwrite,
        )
        sizes = [p.stat().st_size for p in varied_paths]
        avg = sum(sizes) / len(sizes) if sizes else 0
        print(f"  {DUMMY_PREFIX} varied wrote {len(varied_paths)} (requested {count})")
        if sizes:
            print(f"  Size range: {min(sizes)}–{max(sizes)} bytes, avg {avg:.0f} bytes")
        print(f"Done — {len(varied_paths)} file(s) written this run.")
        return

    output = args.output or RAW_DIR
    count = args.count if args.count is not None else 85
    total_written = 0
    if not args.dummy_only:
        print(f"Generating [SAMPLE] bulk → {(output / 'samples').resolve()}")
        paths = generate_bulk_dummy_data(output, overwrite=args.overwrite)
        total_written += len(paths)
        print(f"  [SAMPLE] wrote {len(paths)} ({len(BULK_FILES)} defined)")

    if not args.samples_only:
        print(f"Generating {DUMMY_PREFIX} procedural files → {output.resolve()}")
        dummy_paths = generate_procedural_dummy_test_data(
            output,
            count=count,
            overwrite=args.overwrite,
            start_seq=args.start_seq,
            only_subdir=args.only_subdir,
        )
        total_written += len(dummy_paths)
        print(f"  {DUMMY_PREFIX} wrote {len(dummy_paths)} (requested {count})")

    print(f"Done — {total_written} file(s) written this run.")


if __name__ == "__main__":
    main()

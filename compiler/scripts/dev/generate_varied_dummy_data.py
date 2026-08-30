#!/usr/bin/env python3
"""Generate large, type-varied [DUMMY TEST DATA] files for compiler pipeline testing."""

from __future__ import annotations

import argparse
from pathlib import Path

RAW_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "raw"
VARIED_DIR = "varied-samples"
DUMMY_PREFIX = "[DUMMY TEST DATA]"

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
    "Dev Singh",
)
PRODUCTS = (
    "Nova Widget",
    "MeshSync",
    "TeaBuddy Puck",
    "SenseNode SN-400",
    "GreenGrid Hub",
    "PulsePatch wearable",
)
COMPANIES = (
    ("Aurora Labs", "aurora"),
    ("TeaBuddy", "teabuddy"),
    ("GreenGrid Energy", "greengrid"),
    ("Nova Health", "nova-health"),
)

# (type_slug, extension) — output: varied-samples/{type_slug}/
DOC_TYPES: list[tuple[str, str]] = [
    ("transcript", "txt"),
    ("prd", "md"),
    ("email", "txt"),
    ("research", "md"),
    ("adr", "md"),
    ("changelog", "md"),
    ("faq", "md"),
    ("chat-log", "txt"),
    ("interview", "txt"),
    ("spec", "md"),
]


# Target byte sizes — cycle 3–15 KB (35 files)
SIZE_TARGETS = (
    3200, 4800, 6400, 8200, 9800, 11500, 14200,
    3500, 7200, 10800, 15000, 4100, 8900, 12300,
    3300, 5600, 7700, 10100, 13600, 4600, 9200,
    3800, 6100, 8400, 11200, 14800, 5200, 8700,
    3400, 6900, 9500, 12800, 4400, 7400, 11900,
)


FILLER_PARAGRAPHS = [
    "Cross-reference: MeshSync rejoin storms above six nodes remain a P0 for Aurora beta.",
    "TeaBuddy pairing timeout was extended to 45 seconds after iOS 18 CoreBluetooth regressions.",
    "Marketing copy still mentions two-year battery life; engineering model shows ~18 months at ten nodes.",
    "SenseNode SN-400 is splash-resistant IP54; Nova Widget beta units are splash-resistant only — not waterproof.",
    "Default Nova Widget read interval is fifteen minutes, not hourly (kickoff slides were wrong).",
    "Herbal tea preset is seven minutes in firmware; box label was corrected in batch three.",
    "MQTT export schema v2 is optional and local-broker only; no cloud telemetry in v1.",
    "GreenGrid Hub integration is exploratory; no committed API surface for Q3.",
    "PulsePatch wearable shares no firmware lineage with MeshSync despite investor FAQ confusion.",
    "Wiki compiler heuristic mode extracts headers, bold terms, and first-line topics per chunk.",
    "CR2032 sleep draw on TeaBuddy Puck reduced from 12µA to 9µA in firmware v0.9.2.",
    "Support ticket TB-2156 tracked iOS 18 pairing failures; closed after v0.9.3 shipped.",
    "Parent election logging exports RSSI and hop count via debug UART on MeshSync 0.3.8.",
    "Android TeaBuddy app is v1.1 scope; waitlist replies must not promise ship dates.",
    "Beta tester agreement prohibits resale; enclosure samples ship under separate NDA.",
]

TWO_PERSON_TYPES = frozenset({"transcript", "email", "chat-log", "interview"})


def _pick(seq: int, pool: tuple[str, ...]) -> str:
    return pool[seq % len(pool)]


def _pad(content: str, target_bytes: int, *, min_bytes: int = 3072, max_bytes: int = 15360) -> str:
    """Expand content with domain filler until near target_bytes."""
    cap = max(min_bytes, min(target_bytes, max_bytes))
    body = content.rstrip()
    idx = 0
    while len(body.encode("utf-8")) < cap:
        para = FILLER_PARAGRAPHS[idx % len(FILLER_PARAGRAPHS)]
        body += f"\n\n- ({idx + 1}) {para} Ref seq-{idx:04d}."
        idx += 1
        if idx > 600:
            break
    return body + "\n"


def _header(doc_type: str, company: str, seq: int, day: int, person: str, product: str) -> str:
    date = f"2026-08-{day:02d}"
    return f"""{DUMMY_PREFIX} — {doc_type.replace('_', ' ').title()} — {company}

**Type:** {doc_type}
**Company:** {company}
**Date:** {date}
**Sequence:** {seq:03d}
**Owner:** {person}
**Product:** {product}
**Compiler test:** varied-samples wave — target size 8–25 KB
"""


def gen_transcript(seq: int, company: str, person_a: str, person_b: str, product: str, day: int) -> str:
    h = _header("transcript", company, seq, day, person_a, product)
    lines = [
        h,
        "[TRANSCRIPT — auto-generated fictional meeting fragment]",
        "",
        f"MODERATOR ({person_a}): Thanks for joining. Topic: {product} beta readiness.",
        f"{person_b}: Power budget still shows 340µA spike on MeshSync rejoin — parent swap case.",
        f"{person_a}: We logged RSSI and hop count in 0.3.8. Need field trace from ticket #2099.",
        f"{person_b}: TeaBuddy team asked again about mesh timer sync. Out of scope for Aurora v1.",
        f"{person_a}: Copy says hourly reads; firmware default is fifteen minutes. Fix wiki first.",
        f"{person_b}: iOS 18 pairing — 45s timeout shipped in TeaBuddy 0.9.3. Android waitlist only.",
        "",
        "## Action items",
        "",
        f"- {person_a}: Update power budget doc before investor demo",
        f"- {person_b}: File TB-{2100 + seq} for enclosure IP rating language",
        "- Both: Do not merge BLE stacks across product lines",
        "",
        "## Extended discussion (verbatim-style)",
    ]
    for i in range(24):
        speaker = person_a if i % 2 == 0 else person_b
        lines.append(
            f"{speaker}: Segment {i + 1} — discussing {product} vs SenseNode SN-400 positioning "
            f"and local-first telemetry boundaries for seq {seq}."
        )
    return "\n".join(lines)


def gen_prd(seq: int, company: str, person: str, product: str, day: int) -> str:
    h = _header("prd", company, seq, day, person, product)
    return f"""{h}
# Product Requirements Document — {product} (draft)

## 1. Problem statement

Home users need reliable, local-first sensing without cloud lock-in. {product} must ship with
clear battery expectations and honest waterproof/splash language.

## 2. Goals

| ID | Goal | Metric |
|----|------|--------|
| G1 | Stable mesh ≤6 nodes | <5% rejoin failures / 24h |
| G2 | CR2032 life | ≥18 mo @ 15 min interval |
| G3 | Pairing success iOS | ≥95% first attempt |
| G4 | Documentation accuracy | Zero P0 copy contradictions |

## 3. Non-goals (v1)

- Android TeaBuddy app (v1.1)
- Cloud dashboard
- Mesh timer sync with TeaBuddy
- OTA for MeshSync (UART-only beta)

## 4. User stories

### US-{seq:03d}-01 — Pairing
As a beta tester, I scan QR and connect within 45s on iOS 18.

### US-{seq:03d}-02 — Read interval
As a gardener, I receive soil moisture every fifteen minutes by default.

### US-{seq:03d}-03 — Support clarity
As support, I can cite wiki pages that match firmware behavior.

## 5. Requirements

1. **R1:** Splash-resistant enclosure; IP54 marketing only after legal review.
2. **R2:** MQTT export optional; schema v2 documented in wiki.
3. **R3:** Herbal preset 7:00 ±0.5s (TeaBuddy cross-ref).
4. **R4:** Heuristic compiler must extract entities: {person}, MeshSync, {product}.

## 6. Risks

- Rejoin storm at 8+ nodes (open)
- CR2032 supply chain (email alert seq {seq})
- Competitor SenseNode SN-400 comparison drift

## 7. Open questions

- GreenGrid Hub API timeline?
- PulsePatch wearable — shared brand confusion?
"""


def gen_email(seq: int, company: str, person_a: str, person_b: str, product: str, day: int) -> str:
    date = f"2026-08-{day:02d}"
    return f"""{DUMMY_PREFIX} — Email thread export — {company}

From: {person_a} <{person_a.split()[0].lower()}@{company.split()[0].lower()}.example>
To: {person_b} <{person_b.split()[0].lower()}@{company.split()[0].lower()}.example>
Cc: wiki-ingest-bot@internal.example
Subject: RE: RE: FWD: {product} beta docs — contradictions (seq {seq:03d})
Date: {date} 09:{(seq % 50) + 10:02d} PST

---

{person_b} —

Can we fix the hourly vs fifteen-minute thing before the forum scrape lands in the wiki?
Support is quoting kickoff slides. Firmware says 15 min. Marketing PDF says hourly.

Also: TeaBuddy herbal timer — box says 5 min, app says 7 min after 0.9.4. Separate ticket?

Thanks,
{person_a}

---

From: {person_b}
Date: {date} 10:{(seq % 40) + 15:02d} PST

+1 on read interval. Added TB-{2200 + seq}.

Re: TeaBuddy — not our codebase. Loop in Sam Rivera. Do NOT reply-all vendor thread.

MeshSync 0.3.8 rejoin logging is in wiki draft. Parent swap spike still 180µA (target 110µA).

---

From: {person_a}
Date: {date} 11:02 PST

Copy-pasting investor FAQ snippet for redaction review:

> "{product} delivers two years of battery life with MeshSync mesh networking."

Engineering model: ~18 months, 10 nodes, 15 min interval. Flagging as **CONTRADICTION**.

---

From: legal-review@example
Date: {date} 14:30 PST

Do not ship "waterproof" for beta enclosures. Splash-resistant only. SenseNode comparison OK.

---

[END THREAD — {seq:03d} messages truncated for ingest test]
"""


def gen_research(seq: int, company: str, person: str, product: str, day: int) -> str:
    h = _header("research", company, seq, day, person, product)
    return f"""{h}
# Research notes — {product} competitive & technical landscape

## Sources consulted

1. Capacitive soil probe corrosion forums (compile #{seq})
2. LoRaWAN vs mesh power comparison (rough spreadsheet)
3. iOS 18 CoreBluetooth pairing regressions (Apple dev forums)
4. SenseNode SN-400 public datasheet (IP54 claim)
5. Tea steep chemistry marketing snippets (TeaBuddy content)

## Findings

### Power

MeshSync rejoin cost dominates sleep budget above six nodes. Field traces show 110–340µA spikes
on parent election. LoRaWAN class A wins on single-node duty cycle but loses on local latency.

### Enclosure

Splash-resistant beta gaskets tolerate kitchen steam; submersion tests failed at 30 cm/10 min.
Do not equate with SenseNode outdoor rating.

### BLE pairing

Extended timeout (45s) mitigates iOS 18 permission-order bug. Android backlog separate.

### Market

GreenGrid Energy exploring hub integration — no signed API. PulsePatch wearable causes brand
confusion in investor calls (Nova Health vs Aurora Labs).

## Recommendations

1. Publish honest battery model in wiki before next scrape ingest.
2. Split TeaBuddy and Aurora glossary pages.
3. Tag research dump with `#dummy-regression-{seq:03d}` for compiler tests.

## Raw snippets

> "Users want local MQTT without cloud account" — HN thread scrape ref {seq}
> "Just use Siri timer" — ignore for TeaBuddy positioning
> "Mesh when?" — common Nova Widget forum question
"""


def gen_adr(seq: int, company: str, person: str, product: str, day: int) -> str:
    h = _header("adr", company, seq, day, person, product)
    return f"""{h}
# ADR-{seq:03d}: Local-first telemetry for {product}

**Status:** Accepted (beta)
**Date:** 2026-08-{day:02d}
**Deciders:** {person}, engineering leads

## Context

Beta testers expect privacy-preserving sensing. Cloud dashboard requests were rejected for v1.
MQTT export must work with Home Assistant without Aurora account.

## Decision

Ship optional local MQTT schema v2. No phone-home analytics. MeshSync stays on-device parent
election without cloud coordinator.

## Consequences

**Positive:** Aligns with local-first brand; simplifies GDPR story.
**Negative:** Support burden for self-hosted MQTT; harder OTA story.

## Alternatives considered

1. **Cloud relay (rejected):** Violates v1 privacy commitment.
2. **LoRaWAN backhaul (deferred):** Different product line (SenseNode).
3. **TeaBuddy-style BLE-only (rejected):** {product} requires mesh scale.

## Related

- PRD US-{seq:03d}-02 read interval default
- Ticket #2099 rejoin loop
- Wiki page: what-we-do-not-do
"""


def gen_changelog(seq: int, company: str, person: str, product: str, day: int) -> str:
    h = _header("changelog", company, seq, day, person, product)
    return f"""{h}
# Changelog — {product} / MeshSync (fictional)

## [0.3.{8 + (seq % 3)}] — 2026-08-{day:02d}

### Added
- Parent election debug export (RSSI, hop count) — {person}
- MQTT schema v2 optional fields for Home Assistant
- Wiki ingest regression tag `#dummy-regression-{seq:03d}`

### Fixed
- Rejoin storm mitigation for meshes ≤6 nodes
- Power spike on parent swap: 340µA → 180µA (still above target)
- Documentation: default read interval fifteen minutes

### Known issues
- 8+ nodes unstable (#2099)
- Marketing battery copy not updated (2yr vs 18mo model)
- TeaBuddy herbal preset cross-link still confuses support

## [0.3.7] — 2026-07-28

### Changed
- Beta enclosure labeling: splash-resistant only
- CR2032 BOM alert forwarded to supply chain

## [0.3.6] — 2026-07-15

### Security
- Disabled legacy UART debug in production images (beta exception process)

## Migration notes

Upgrade path: UART flash only. OTA deferred. Export `meshsync.json` before flash.
"""


def gen_faq(seq: int, company: str, person: str, product: str, day: int) -> str:
    h = _header("faq", company, seq, day, person, product)
    return f"""{h}
# FAQ — {product} beta (internal + support)

## General

**Q: Is {product} waterproof?**
A: No. Beta units are splash-resistant only. Do not submerge. SenseNode SN-400 is a different SKU.

**Q: Default reading interval?**
A: Fifteen minutes. Not hourly. Update customer-facing copy if you see otherwise.

**Q: How many sensors on one mesh?**
A: Stable target ≤6 nodes for beta. Eight or more may trigger rejoin storms.

## Battery

**Q: Expected CR2032 life?**
A: Engineering model ~18 months at 10 nodes / 15 min interval. Not two years.

**Q: What affects drain?**
A: Rejoin frequency, parent swaps, debug UART left enabled.

## Pairing & apps

**Q: iOS 18 pairing fails?**
A: Update to TeaBuddy 0.9.3+ (cross-product note) / Nova companion build {seq % 10 + 94}.
Timeout is 45 seconds.

**Q: Android?**
A: Waitlist only for TeaBuddy. Nova Android not planned v1.

## Integrations

**Q: Home Assistant?**
A: Optional local MQTT schema v2. No cloud account required.

**Q: GreenGrid Hub?**
A: Exploratory only — no committed integration date.

## Support macros

- Ticket template TB-{2300 + seq}: pairing timeout
- Escalation: {person} for firmware contradictions
- Do not promise mesh timer sync with TeaBuddy
"""


def gen_chat_log(seq: int, company: str, person_a: str, person_b: str, product: str, day: int) -> str:
    date = f"2026-08-{day:02d}"
    lines = [
        f"{DUMMY_PREFIX} — Slack export — #{company.split()[0].lower()}-engineering",
        f"Date: {date} | Seq: {seq:03d} | Product: {product}",
        "",
        f"[09:12] {person_a}: morning — rejoin trace from ticket 2099 uploaded to wiki draft",
        f"[09:14] {person_b}: seeing 8-node repro in staging again 😬",
        f"[09:15] {person_a}: cap beta docs at 6 nodes until 0.3.9?",
        f"[09:18] dev-bot: heuristic ingest queued for varied-samples/{seq:03d}",
        f"[09:22] {person_b}: TeaBuddy Sam asking about shared mesh — say no for v1",
        f"[09:25] {person_a}: copied investor FAQ battery line — flagging contradiction",
        f"[09:31] {person_b}: 18mo model vs 2yr marketing — legal loop?",
        f"[09:40] {person_a}: splash-resistant ONLY pls stop saying waterproof",
        "",
        "## Thread reply — MQTT schema",
        "",
        f"[10:05] {person_b}: HA community wants retain flag docs",
        f"[10:08] {person_a}: schema v2 section added — local broker only",
        f"[10:12] {person_b}: GreenGrid pinged us again — defer to Q4",
        "",
        "## Thread reply — compiler testing",
        "",
        f"[11:00] {person_a}: running main.py --heuristic-only --force on varied-samples",
        f"[11:02] {person_b}: expect chunk explosion on 15KB chat logs",
        f"[11:05] {person_a}: good — stress test linker cross-refs",
    ]
    for i in range(28):
        speaker = person_a if i % 3 else person_b
        lines.append(
            f"[{11 + i // 6:02d}:{(i * 7) % 60:02d}] {speaker}: "
            f"follow-up {i + 1} on {product} beta checklist item B-{seq}-{i:02d}"
        )
    return "\n".join(lines)


def gen_interview(seq: int, company: str, person_a: str, person_b: str, product: str, day: int) -> str:
    h = _header("interview", company, seq, day, person_a, product)
    return f"""{h}
# User interview #{seq % 20 + 1} — {product} beta (fictional)

**Interviewer:** {person_b}
**Participant:** {person_a} (beta tester, redacted handle)

## Warm-up

Q: How did you hear about {company}?
A: Forum thread on local-first sensors; compared {product} to SenseNode SN-400.

Q: First impression of setup?
A: Pairing took two tries on iOS 18 — support said wait 45 seconds; that fixed it.

## Core usage

Q: What do you use it for daily?
A: Kitchen herb monitoring and one balcony planter. Read interval feels frequent enough.

Q: Anything confusing in the box or app?
A: Box said waterproof; wiki says splash-resistant. I almost submerged a puck.

## Feature requests

- Android app (on waitlist)
- MQTT retain docs for Home Assistant
- Lower price than GreenGrid bundle

## Deep dive — mesh behavior

Q: How many nodes in your mesh?
A: Five {product} units plus one MeshSync coordinator. Rejoin happened twice after router reboot.

Q: Did support docs match reality?
A: Mostly. Herbal preset cross-link from TeaBuddy confused my partner — wrong product FAQ.

## Closing

Q: Would you recommend to a friend?
A: Yes, if they read the wiki first and stay under six mesh nodes.

- Tag ingest: interview-{seq:03d}
- Cross-ref: TeaBuddy herbal preset seven minutes vs old five-minute label
"""


def gen_spec(seq: int, company: str, person: str, product: str, day: int) -> str:
    h = _header("spec", company, seq, day, person, product)
    return f"""{h}
# Technical specification — {product} hardware rev D (fragment)

## Mechanical

- Enclosure: ABS + TPU gasket, latch v3
- IP rating target: splash-resistant (IP54 class reference only)
- Mass: 42g ± 2g without battery

## Electrical

- Primary cell: CR2032, user-replaceable
- Sleep draw budget: ≤ 10µA average at 25°C
- Radio: BLE 5.0 + proprietary mesh layer (MeshSync 0.3.x)

## Firmware interfaces

- OTA: signed bundle, rollback slot B
- Debug UART: parent election RSSI export (engineering builds)

## BLE GATT (fictional)

- Service UUID: fictional-aurora-{seq:04x}
- Characteristic: device-info, telemetry burst, config block

## Test requirements

1. Soak test: 24h at 90% RH — no condensation inside
2. Drop: 1m concrete, 6 faces — no latch open
3. Mesh soak: 6 nodes, 72h, rejoin count < 3/node/day

## Environmental

- Operating temp: 0°C to 45°C (kitchen + balcony beta scope)
- Storage: dry, no CR2032 installed for >12 months

## Open spec issues

- SPEC-{seq:03d}-01: Document rejoin spike mitigation level
- SPEC-{seq:03d}-02: Align box QR URL with wiki quick-start
- SPEC-{seq:03d}-03: TeaBuddy cross-contamination in shared warehouse SKU labels
"""


GENERATORS = {
    "transcript": gen_transcript,
    "prd": gen_prd,
    "email": gen_email,
    "research": gen_research,
    "adr": gen_adr,
    "changelog": gen_changelog,
    "faq": gen_faq,
    "chat-log": gen_chat_log,
    "interview": gen_interview,
    "spec": gen_spec,
}


def _build_file_spec(index: int, *, min_bytes: int = 3072, max_bytes: int = 15360) -> tuple[str, str, int]:
    """Return (relative path, content, target_bytes) for file index."""
    type_slug, ext = DOC_TYPES[index % len(DOC_TYPES)]
    company_name, company_slug = COMPANIES[index % len(COMPANIES)]
    seq = index + 1
    day = 1 + (index % 28)
    person_a = _pick(index, PEOPLE)
    person_b = _pick(index + 5, PEOPLE)
    product = _pick(index + seq, PRODUCTS)
    target = max(min_bytes, min(SIZE_TARGETS[index % len(SIZE_TARGETS)], max_bytes))

    gen = GENERATORS[type_slug]
    if type_slug in TWO_PERSON_TYPES:
        raw = gen(seq, company_name, person_a, person_b, product, day)
    else:
        raw = gen(seq, company_name, person_a, product, day)

    content = _pad(raw, target, min_bytes=min_bytes, max_bytes=max_bytes)
    rel = (
        f"{VARIED_DIR}/{type_slug}/"
        f"[DUMMY-TEST-DATA]-{type_slug}-{company_slug}-{seq:03d}-2026-08-{day:02d}.{ext}"
    )
    return rel, content, target


def generate_varied_dummy_data(
    raw_dir: Path | None = None,
    *,
    count: int = 35,
    min_bytes: int = 3072,
    max_bytes: int = 15360,
    overwrite: bool = False,
    clean: bool = False,
) -> list[Path]:
    """Write type-varied files under data/raw/varied-samples/{type}/. Returns paths written."""
    root = raw_dir or RAW_DIR
    out_root = root / VARIED_DIR
    if clean and out_root.exists():
        import shutil

        shutil.rmtree(out_root)
    written: list[Path] = []

    for i in range(count):
        rel, content, _ = _build_file_spec(i, min_bytes=min_bytes, max_bytes=max_bytes)
        out = root / rel
        out.parent.mkdir(parents=True, exist_ok=True)

        if out.exists() and not overwrite:
            print(f"  skip (exists): {rel}")
            continue

        out.write_text(content, encoding="utf-8")
        written.append(out)
        size_kb = len(content.encode("utf-8")) / 1024
        print(f"  wrote: {rel} ({size_kb:.1f} KB)")

    return written


def summarize_files(
    raw_dir: Path | None = None,
    count: int = 35,
    *,
    min_bytes: int = 3072,
    max_bytes: int = 15360,
) -> None:
    """Print type and size stats for defined file set."""
    root = raw_dir or RAW_DIR
    by_type: dict[str, list[float]] = {}
    sizes: list[float] = []

    for i in range(count):
        rel, content, _ = _build_file_spec(i, min_bytes=min_bytes, max_bytes=max_bytes)
        type_slug = DOC_TYPES[i % len(DOC_TYPES)][0]
        kb = len(content.encode("utf-8")) / 1024
        sizes.append(kb)
        by_type.setdefault(type_slug, []).append(kb)
        path = root / rel
        if path.exists():
            kb = path.stat().st_size / 1024
            sizes[-1] = kb
            by_type[type_slug][-1] = kb

    print("\nType breakdown (files / avg KB):")
    for type_slug, _ in DOC_TYPES:
        vals = by_type.get(type_slug, [])
        avg = sum(vals) / len(vals) if vals else 0
        print(f"  {type_slug:14s}  {len(vals):2d} files  avg {avg:.1f} KB")

    if sizes:
        print(
            f"\nOverall: {len(sizes)} files, avg {sum(sizes) / len(sizes):.1f} KB, "
            f"min {min(sizes):.1f} KB, max {max(sizes):.1f} KB"
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate large type-varied [DUMMY TEST DATA] files in data/raw/varied-samples/{type}/"
    )
    parser.add_argument("--overwrite", action="store_true", help="Replace existing files")
    parser.add_argument("--clean", action="store_true", help="Remove varied-samples/ before generating")
    parser.add_argument("--count", type=int, default=35, help="Number of files (default: 35)")
    parser.add_argument("--min-bytes", type=int, default=3072, help="Minimum file size (default: 3072 = 3KB)")
    parser.add_argument("--max-bytes", type=int, default=15360, help="Maximum file size (default: 15360 = 15KB)")
    parser.add_argument(
        "--output",
        type=Path,
        default=RAW_DIR,
        help=f"Raw root directory (default: {RAW_DIR})",
    )
    parser.add_argument("--stats-only", action="store_true", help="Print stats without writing")
    args = parser.parse_args()

    if args.stats_only:
        summarize_files(args.output, count=args.count, min_bytes=args.min_bytes, max_bytes=args.max_bytes)
        return

    print(
        f"Generating {args.count} varied dummy files → {(args.output / VARIED_DIR).resolve()} "
        f"(min={args.min_bytes} max={args.max_bytes} bytes)"
    )
    paths = generate_varied_dummy_data(
        args.output,
        count=args.count,
        min_bytes=args.min_bytes,
        max_bytes=args.max_bytes,
        overwrite=args.overwrite,
        clean=args.clean,
    )
    print(f"Done — {len(paths)} file(s) written.")
    summarize_files(args.output, count=args.count, min_bytes=args.min_bytes, max_bytes=args.max_bytes)


if __name__ == "__main__":
    main()

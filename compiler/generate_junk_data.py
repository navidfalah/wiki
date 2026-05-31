#!/usr/bin/env python3
"""Generate mock raw text files with junk data for LLM Wiki practice."""

from __future__ import annotations

from pathlib import Path

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"

JUNK_FILES: dict[str, str] = {
    "notes/2026-06-01-standup-scribbles.txt": """STANDUP — june 1?? (late again)

mira: mesh still weird at 8 nodes. spike 110µA on rejoin. "fine for beta"

jonah: gasket samples = meh. IP54 ok. IP65 = $8k tool rip

me: forgot to update the wiki AGAIN

TODO ???
- fix cron job on staging (maybe?)
- ask about solar trickle — jonah yes / mira no
- lunch

random: why do CR2032 cells cost more at the hardware store than online

---
fragment: "open sensors for people who own their data" — still good?
""",
    "notes/2026-06-03-grocery-and-ideas.txt": """GROCERY
- milk
- batteries (CR2032 x4)  <-- nova prototypes
- coffee
- that one cheese

PROJECT IDEA #47: "Plant Whisperer"
app that yells at you when soil is dry. connects to nova widget??
monetization: idk stickers

PROJECT IDEA #48: reverse mesh — phones as nodes (bad idea?)

thought @ 2am: what if wiki maintained itself. like karpathy thing.
note to self: look up "llm wiki pattern"

call dentist Thursday

unfinished sentence: the enclosure needs to be more like a pebble and less like a
""",
    "transcripts/2026-06-05-sync-fragment.txt": """[TRANSCRIPT FRAGMENT — recording failed at 00:04:12]

MIRA: So the fifteen minute default is—

JONAH: —hourly was kickoff though.

MIRA: Spec says fifteen. Marketing can say two years but engineering wants eighteen months minimum at ten nodes.

UNKNOWN VOICE: (cough)

JONAH: Alex's blog had the wrong battery. CR2450. We use two-oh-three-two.

MIRA: We should ingest that correction into the wiki.

[END FRAGMENT]

action items lost in corruption:
- [???] revalidate battery math
- [???] reply to Hardware Habit comment
""",
    "articles/scraped-forum-thread.txt": """Forum: HomeLab Sensors — Thread #8821 (scraped badly)

User_Potato99 (2026-05-29):
anyone tried aurora labs nova thing? beta invite?

User_MeshFan (2026-05-29):
meshsync interesting. no cloud. my kind of toy.

User_Potato99:
how long battery tho

User_MeshFan:
they claim 2yr @ 15min reads. i got ~20mo est in teardown blog somewhere

User_Random:
sensenode better waterproof ip67

User_MeshFan:
yeah but subscription ugh

[page cut off mid-thread — CSS selector wrong???]
""",
    "articles/voice-memo-transcription.txt": """Voice memo transcription (auto, low confidence)

"okay so remember we wanted the… the widget thing to feel like garden equipment not like surveillance"

"jonah said petg for beta injection mold later if we raise"

"mesh sync mesh sync mesh sync — name is fine don't rename again"

"contradiction flag hourly versus fifteen minutes fix before beta testers"

"also mira wants mqtt export csv optional dashboard never mandatory"

[inaudible]

"end memo"
""",
    "ideas/backlog-shower-thoughts.txt": """BACKLOG — unsorted junk drawer

1. Wiki linter that finds orphan pages (orphans = bad)
2. Color-coded LED on device for "I'm dying" battery state
3. Partnership with community garden network??? cold email draft somewhere
4. Rename MeshSync → MeshSink (NO — rejected 3x)
5. Document contradictions explicitly in wiki pages
6. Fake competitor name generator for demos
7. Why is index.md always out of date in every project

half-baked: compile raw txt → md → docusaurus pipeline

priority: ¯\\_(ツ)_/¯
""",
    "ideas/2026-06-07-product-naming-brainstorm.txt": """Naming brainstorm — DO NOT SEND TO CUSTOMERS

Nova Widget ✓ (keep)
Aurora Labs ✓ (keep)

REJECTED:
- SoilPal
- GritNode
- PetalPing
- CloudFree Sensor (too on the nose)
- KarpathyGarden (???)

Taglines tried:
- "Sense without surrender" — cringe
- "Your data, your dirt" — worse
- "Open sensors for people who own their data" — still the best???

jonah wants pebble shape. mira wants hex. fight continues.
""",
    "notes/2026-06-08-meeting-no-agenda.txt": """"meeting" — no agenda, 23 min

attendees: mira, jonah, me (took notes badly)

topics wandered:
- competitor teardown blog — mostly fair, wrong battery once fixed
- should we publish power numbers? mira cautious
- beta tester list: 12 people, 3 farmers, rest hobbyists
- someone mentioned obsidian graph view. everyone nodded.

decisions made: none formally

decisions implied:
- ship IP54 beta first
- don't rename anything
- wiki needs love (again)

next meeting: tbd "when mesh stable"
""",
    "transcripts/support-email-thread.txt": """Support inbox dump — ticket #1042 (redacted names)

Customer: widget stopped reporting after rain. is it waterproof?

Us (draft never sent): IP54 resists splash not submersion. recommend cover or elevated mount.

Customer follow-up: neighbor has SenseNode, never had issue.

Internal note from Jonah: fair point on sealing gap. add to comparison page?

Customer: also what reading interval default?

Internal: SPEC SAYS 15 MIN — kickoff said hourly — FIX DOCS

---
ticket still open
""",
    "notes/2026-06-10-fragmented-research.txt": """research tabs open right now (mental dump)

- nRF52840 sleep modes
- capacitive soil probe corrosion
- karpathy gist llm wiki
- "compounding knowledge" quote
- docusaurus sidebar autogenerated
- cr2032 discharge curve

sentence starters never finished:
- If mesh rejoin spikes persist then
- The contradiction between marketing and engineering battery claims suggests
- A linter could grep for "Contradiction:" blocks and

bookmark: compare mesh power vs lorawan duty cycle when less tired
""",
}


def generate_junk_data(raw_dir: Path | None = None, *, overwrite: bool = False) -> list[Path]:
    """Write mock junk files to data/raw/. Returns paths of files written."""
    target = raw_dir or RAW_DIR
    target.mkdir(parents=True, exist_ok=True)

    written: list[Path] = []
    for rel_path, content in JUNK_FILES.items():
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
        description="Generate 10 mock junk raw text files in data/raw/"
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
        help=f"Output directory (default: {RAW_DIR})",
    )
    args = parser.parse_args()

    print(f"Generating junk data → {args.output.resolve()}")
    paths = generate_junk_data(args.output, overwrite=args.overwrite)
    print(f"Done — {len(paths)} file(s) written ({len(JUNK_FILES)} total defined).")


if __name__ == "__main__":
    main()

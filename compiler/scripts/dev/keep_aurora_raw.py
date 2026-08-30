#!/usr/bin/env python3
"""Keep Aurora Labs raw sources; move everything else out of data/raw/."""

from __future__ import annotations

import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
RAW = PROJECT_ROOT / "data" / "raw"
ARCHIVE = PROJECT_ROOT / "data" / "_archive_non_aurora"

KEEP_REL = {
    "articles/2026-05-15-product-spec-draft.md",
    "articles/2026-05-20-competitor-teardown-blog.md",
    "articles/TEST-product-brief.md",
    "articles/scraped-forum-thread.txt",
    "articles/voice-memo-transcription.txt",
    "notes/2026-05-01-kickoff-notes.md",
    "notes/2026-06-01-standup-scribbles.txt",
    "notes/2026-06-03-grocery-and-ideas.txt",
    "notes/2026-06-08-meeting-no-agenda.txt",
    "notes/2026-06-10-fragmented-research.txt",
    "notes/TEST-kickoff-meeting.txt",
    "notes/TEST-slack-dump.txt",
    "transcripts/2026-05-28-weekly-sync.md",
    "transcripts/2026-06-05-sync-fragment.txt",
    "transcripts/TEST-support-ticket.txt",
    "ideas/2026-06-07-product-naming-brainstorm.txt",
    "ideas/backlog-shower-thoughts.txt",
    "dummy-test/2026-07-01-firmware-changelog.md",
    "dummy-test/2026-07-02-aurora-meshsync-release-notes.md",
    "dummy-test/2026-07-04-investor-update-draft.txt",
    "dummy-test/2026-07-06-slack-dump-product.txt",
    "dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt",
    "dummy-test/2026-07-08-customer-onboarding-faq.md",
    "samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md",
    "samples/articles/[SAMPLE]-2026-06-17-broken-markdown-export.md",
    "samples/articles/[SAMPLE]-2026-07-02-mqtt-export-schema.md",
    "samples/articles/[SAMPLE]-2026-07-04-ota-update-design-sketch.md",
    "samples/articles/[SAMPLE]-2026-07-08-homelab-integration-guide.md",
    "samples/articles/[SAMPLE]-2026-07-09-competitive-landscape-q3.md",
    "samples/articles/[SAMPLE]-2026-07-11-wiki-compiler-heuristic-notes.md",
    "samples/emails/[SAMPLE]-2026-07-01-beta-invite-batch.txt",
    "samples/emails/[SAMPLE]-2026-07-08-legal-review-trademark.txt",
    "samples/forums/[SAMPLE]-2026-06-29-homelab-sensors-nova-scrape.html.txt",
    "samples/forums/[SAMPLE]-2026-07-03-github-issue-meshsync-442.txt",
    "samples/forums/[SAMPLE]-2026-07-10-hackernews-thread-scrape.txt",
    "samples/ideas/[SAMPLE]-2026-07-04-wiki-automation-ideas.txt",
    "samples/ideas/[SAMPLE]-2026-07-10-backlog-grooming-snippet.txt",
    "samples/legal/[SAMPLE]-2026-07-04-beta-tester-agreement-snippet.txt",
    "samples/notes/[SAMPLE]-2026-06-12-meshsync-debug-scribbles.txt",
    "samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt",
    "samples/notes/[SAMPLE]-2026-07-01-aurora-standup.txt",
    "samples/notes/[SAMPLE]-2026-07-05-lunch-and-learn-notes.txt",
    "samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt",
    "samples/research/[SAMPLE]-2026-07-02-ble-pairing-ios18-notes.md",
    "samples/research/[SAMPLE]-2026-07-04-soil-probe-corrosion-study.txt",
    "samples/research/[SAMPLE]-2026-07-06-lorawan-vs-mesh-power.md",
    "samples/social/[SAMPLE]-2026-07-02-twitter-thread-scrape.txt",
    "samples/specs/[SAMPLE]-2026-07-03-nova-widget-hardware-rev-C.md",
    "samples/specs/[SAMPLE]-2026-07-07-meshsync-protocol-header.txt",
    "samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt",
    "samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt",
    "samples/support/[SAMPLE]-2026-07-04-ticket-2210-mqtt-setup.txt",
    "samples/support/[SAMPLE]-2026-07-08-ticket-2222-waterproof-confusion.txt",
    "samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt",
    "samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt",
    "samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt",
    "samples/transcripts/[SAMPLE]-2026-07-11-podcast-outline-unrecorded.txt",
}


def main() -> None:
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    staging = PROJECT_ROOT / "data" / "_aurora_raw_staging"
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)

    missing: list[str] = []
    for rel in sorted(KEEP_REL):
        src = RAW / rel
        if not src.is_file():
            missing.append(rel)
            continue
        dest = staging / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)

    if missing:
        print("Warning: missing keep files:", ", ".join(missing[:5]), "…")

    # Move entire old raw tree to archive, restore aurora-only staging
    archive_raw = ARCHIVE / "raw_before_aurora_only"
    if archive_raw.exists():
        shutil.rmtree(archive_raw)
    shutil.move(str(RAW), str(archive_raw))
    shutil.move(str(staging), str(RAW))

    kept = sum(1 for _ in RAW.rglob("*") if _.is_file() and _.suffix in {".md", ".txt"})
    archived = sum(
        1 for _ in archive_raw.rglob("*") if _.is_file() and _.suffix in {".md", ".txt"}
    )
    print(f"Kept {kept} Aurora Labs files in data/raw/")
    print(f"Archived {archived} files to {archive_raw}")


if __name__ == "__main__":
    main()

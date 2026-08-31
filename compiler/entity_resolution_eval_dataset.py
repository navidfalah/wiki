"""A small hand-labeled entity resolution eval set, built from real name/
email mentions actually present in data/raw/ (paths below are verified —
see tests/test_entity_resolution_eval_dataset.py — not invented).

Includes the hard-negative case this repo's own corpus happens to contain:
Alex Kim, Alex Rivera, and Sam Rivera are three different people who share
a first or last name, and Nova Widget vs. a bare "Nova" mention should
still resolve to one product — a small but real test of whether a resolver
merges on name overlap alone (wrong) or requires stronger evidence (right).
"""

from __future__ import annotations

from entity_resolution import Mention

# (Mention, gold_entity_id) pairs. gold_entity_id is this eval set's own
# annotation — it doesn't exist anywhere in the compiler pipeline itself.
GOLD_MENTIONS: list[tuple[Mention, str]] = [
    (Mention("Mira Chen", "articles/2026-05-15-product-spec-draft.md"), "mira-chen"),
    (Mention("Mira", "samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt"), "mira-chen"),
    (Mention("mira.chen@auroralabs.example", "emails/2026-06-02-meshsync-battery-report.eml"), "mira-chen"),
    (Mention("Jonah Park", "notes/2026-05-01-kickoff-notes.md"), "jonah-park"),
    (Mention("Jonah", "samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt"), "jonah-park"),
    (Mention("jonah.park@auroralabs.example", "emails/2026-06-03-meshsync-battery-reply.eml"), "jonah-park"),
    (Mention("Alex Kim", "dummy-test/2026-07-01-firmware-changelog.md"), "alex-kim"),
    (Mention("alex.kim@teabuddy.example", "samples/emails/[SAMPLE]-2026-07-08-legal-review-trademark.txt"), "alex-kim"),
    (Mention("Alex Rivera", "articles/2026-05-20-competitor-teardown-blog.md"), "alex-rivera"),
    (Mention("Sam Rivera", "dummy-test/2026-07-02-aurora-meshsync-release-notes.md"), "sam-rivera"),
    (Mention("Sam Rivera", "dummy-test/2026-07-01-firmware-changelog.md"), "sam-rivera"),
    (Mention("Nova Widget", "articles/2026-05-15-product-spec-draft.md"), "nova-widget"),
    (Mention("Nova", "notes/2026-05-01-kickoff-notes.md"), "nova-widget"),
]

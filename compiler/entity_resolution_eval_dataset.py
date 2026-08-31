"""A small hand-labeled entity resolution eval set, built from real name/
email mentions actually present in data/raw/ (paths below are verified —
see tests/test_entity_resolution_eval_dataset.py — not invented).

Includes the hard-negative case this repo's own corpus happens to contain:
Alex Kim, Alex Rivera, and Sam Rivera are three different people who share
a first or last name, and Nova Widget vs. a bare "Nova" mention should
still resolve to one product — a small but real test of whether a resolver
merges on name overlap alone (wrong) or requires stronger evidence (right).

Two more hard cases, both drawn from articles/2026-05-20-competitor-teardown-blog.md
(which discusses two products side by side, in the same table): "Aurora Nova
Widget" is a longer surface form of the same product as "Nova Widget"/"Nova"
(should merge — a positive case that also stresses the multi-word "Aurora
Nova Widget" vs. "Nova Widget" partial-token overlap), while "SenseNode
SN-400" is a *competitor's* product mentioned in the same document, in the
same comparison table — a hard negative that isn't a name-token collision
like Alex Kim/Alex Rivera, but a proximity/co-occurrence one: two distinct
products discussed together should not be pulled toward each other by
whatever the resolver uses for context.
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
    (Mention("Aurora Nova Widget", "articles/2026-05-20-competitor-teardown-blog.md"), "nova-widget"),
    (Mention("SenseNode SN-400", "articles/2026-05-20-competitor-teardown-blog.md"), "sensenode-sn-400"),
    (Mention("Sam", "dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt"), "sam-rivera"),
]

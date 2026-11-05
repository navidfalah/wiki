'use strict';

const GOLD_MENTIONS = [
  [{ name: 'Mira Chen', source: 'articles/2026-05-15-product-spec-draft.md' }, 'mira-chen'],
  [{ name: 'Mira', source: 'samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt' }, 'mira-chen'],
  [{ name: 'mira.chen@auroralabs.example', source: 'emails/2026-06-02-meshsync-battery-report.eml' }, 'mira-chen'],
  [{ name: 'Jonah Park', source: 'notes/2026-05-01-kickoff-notes.md' }, 'jonah-park'],
  [{ name: 'Jonah', source: 'samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt' }, 'jonah-park'],
  [{ name: 'jonah.park@auroralabs.example', source: 'emails/2026-06-03-meshsync-battery-reply.eml' }, 'jonah-park'],
  [{ name: 'Alex Kim', source: 'dummy-test/2026-07-01-firmware-changelog.md' }, 'alex-kim'],
  [{ name: 'alex.kim@teabuddy.example', source: 'samples/emails/[SAMPLE]-2026-07-08-legal-review-trademark.txt' }, 'alex-kim'],
  [{ name: 'Alex Rivera', source: 'articles/2026-05-20-competitor-teardown-blog.md' }, 'alex-rivera'],
  [{ name: 'Sam Rivera', source: '2026-07-02-aurora-meshsync-release-notes.md' }, 'sam-rivera'],
  [{ name: 'Sam Rivera', source: 'dummy-test/2026-07-01-firmware-changelog.md' }, 'sam-rivera'],
  [{ name: 'Nova Widget', source: 'articles/2026-05-15-product-spec-draft.md' }, 'nova-widget'],
  [{ name: 'Nova', source: 'notes/2026-05-01-kickoff-notes.md' }, 'nova-widget'],
  [{ name: 'Aurora Nova Widget', source: 'articles/2026-05-20-competitor-teardown-blog.md' }, 'nova-widget'],
  [{ name: 'SenseNode SN-400', source: 'articles/2026-05-20-competitor-teardown-blog.md' }, 'sensenode-sn-400'],
  [{ name: 'Sam', source: 'dummy-test/2026-07-07-power-budget-spreadsheet-notes.txt' }, 'sam-rivera'],
];

module.exports = { GOLD_MENTIONS };

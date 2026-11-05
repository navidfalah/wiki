'use strict';

const FIXTURES = [
  { name: 'fabricated_version_number', source_text: "Confirmed on the bench. The relay radio's sleep timer resets on every received packet, so a busy mesh never lets it sleep. Draft fix in MESH-118 drops radio wake time from 400ms to 80ms per hop.", draft_body: "## MeshSync relay battery drain\n\nThe relay radio's sleep timer resets on every received packet, preventing sleep in a busy mesh. The fix, shipped in firmware version 4.2.0, drops radio wake time from 400ms to 80ms per hop.", expected_flagged_substrings: ['firmware version 4.2.0'], expected_clean_substrings: ['sleep timer resets on every received packet'] },
  { name: 'fabricated_date_and_attribution', source_text: 'Default: every 15 minutes when mesh is active. Configurable 5 min - 24 hr via companion app. Note: kickoff notes mentioned hourly default; this spec changes to 15 min for beta feedback.', draft_body: '## Nova Widget read interval\n\nThe default read interval is 15 minutes, configurable from 5 minutes to 24 hours via the companion app. Jonah Park changed this from an hourly default on March 3rd after a customer complaint.', expected_flagged_substrings: ['Jonah Park changed this from an hourly default on March 3rd'], expected_clean_substrings: ['default read interval is 15 minutes'] },
  { name: 'fabricated_metric', source_text: 'CR2032 nominal 220mAh (not 240 - datasheet variance). Read interval: 15 min (spec authoritative). Total ~0.19 mAh/day -> ~18 months (engineering claim).', draft_body: '## Nova Widget battery budget\n\nUsing a CR2032 cell (220mAh nominal) at the spec-authoritative 15-minute read interval, engineering estimates roughly 18 months of runtime at 0.19 mAh/day. Field testing across 40 beta units confirmed an average of 19.4 months.', expected_flagged_substrings: ['Field testing across 40 beta units confirmed an average of 19.4 months'], expected_clean_substrings: ['roughly 18 months of runtime'] },
  { name: 'fully_grounded_no_hallucination', source_text: 'Herbal preset constant aligned to 7:00 (was 5:00 in marketing copy - CONTRADICTION fixed in firmware only).', draft_body: "## TeaBuddy herbal preset timing\n\nThe firmware's herbal preset constant is now 7:00, correcting an earlier mismatch with marketing copy that listed 5:00. The fix has not yet propagated back to marketing materials.", expected_flagged_substrings: [], expected_clean_substrings: ['herbal preset constant is now 7:00'] },
];

function containsAny(sentences, needle) {
  const normalized = String(needle).toLocaleLowerCase('en');
  return sentences.some((sentence) => String(sentence).toLocaleLowerCase('en').includes(normalized));
}

async function evaluateFixtures(reviewFn) {
  let true_positives = 0, false_negatives = 0, false_positives = 0;
  const results = [];
  for (const fixture of FIXTURES) {
    const report = await reviewFn(fixture.source_text, fixture.draft_body);
    const flagged = (report.flagged || []).map((item) => item.sentence);
    const fixtureResult = { name: fixture.name, parse_error: report.parseError || null, expected_flags: [], expected_clean: [] };
    for (const expected of fixture.expected_flagged_substrings) {
      const hit = containsAny(flagged, expected);
      fixtureResult.expected_flags.push({ expected, hit });
      if (hit) true_positives++; else false_negatives++;
    }
    for (const expected of fixture.expected_clean_substrings) {
      const falsePositive = containsAny(flagged, expected);
      fixtureResult.expected_clean.push({ expected, false_positive: falsePositive });
      if (falsePositive) false_positives++;
    }
    results.push(fixtureResult);
  }
  const precisionDenom = true_positives + false_positives, recallDenom = true_positives + false_negatives;
  return { results, true_positives, false_negatives, false_positives, precision: precisionDenom ? true_positives / precisionDenom : Number.NaN, recall: recallDenom ? true_positives / recallDenom : Number.NaN };
}

module.exports = { FIXTURES, containsAny, evaluateFixtures };

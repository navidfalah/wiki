const { describe, expect, it } = require('vitest');
const path = require('node:path');
const { FIXTURES, containsAny, evaluateFixtures } = require(path.resolve(__dirname, '../../../compiler/extractionCriticEval.js'));

describe('extraction critic evaluation fixtures', () => {
  it('keeps every expected finding and clean phrase inside its draft', () => {
    for (const fixture of FIXTURES) {
      expect(fixture.name).toBeTruthy();
      expect(fixture.source_text.trim()).toBeTruthy();
      expect(fixture.draft_body.trim()).toBeTruthy();
      for (const expected of [...fixture.expected_flagged_substrings, ...fixture.expected_clean_substrings]) {
        expect(fixture.draft_body.toLowerCase()).toContain(expected.toLowerCase());
      }
      for (const flagged of fixture.expected_flagged_substrings) for (const clean of fixture.expected_clean_substrings) {
        expect(flagged.toLowerCase()).not.toContain(clean.toLowerCase());
        expect(clean.toLowerCase()).not.toContain(flagged.toLowerCase());
      }
    }
    expect(FIXTURES.some((fixture) => fixture.expected_flagged_substrings.length === 0)).toBe(true);
  });

  it('matches substrings without case sensitivity', () => {
    expect(containsAny(['The Sky Is Blue'], 'sky is blue')).toBe(true);
    expect(containsAny(['The Sky Is Blue'], 'grass is green')).toBe(false);
  });

  it('evaluates injected critic reports through the same fixture set', async () => {
    const report = await evaluateFixtures(async (_source, draft) => ({ flagged: draft.includes('4.2.0') ? [{ sentence: 'firmware version 4.2.0' }] : [] }));
    expect(report.results).toHaveLength(FIXTURES.length);
    expect(report.true_positives).toBe(1);
    expect(report.false_negatives).toBe(2);
    expect(report.false_positives).toBe(0);
  });
});

const { describe, expect, it } = require('vitest');
const { redactText, STRICT_POLICY } = require('./piiRedaction');
const { FIXTURES, NER_ONLY_FIXTURES, runEval, NER_AUGMENTED_POLICY } = require('./piiRedactionEval');

describe('PII redaction evaluation', () => {
  it('all expected fixture values are actually detectable by their selected policy', () => {
    for (const fixture of FIXTURES) {
      const result = redactText(fixture.text, STRICT_POLICY);
      const found = new Set(result.findings.map(({ category, original }) => `${category}\0${original}`));
      for (const expected of fixture.expected) expect(found.has(expected), `${fixture.name}: ${expected}`).toBe(true);
    }
  });

  it('scores the offline fixtures and reports injected misses and false positives', () => {
    const report = runEval();
    expect(report.precision).toBe(1);
    expect(report.recall).toBe(1);
    expect(report.false_positives).toBe(0);
    expect(report.false_negatives).toBe(0);
    const miss = runEval([{ name: 'missing', text: 'No PII here.', expected: new Set([`ssn\0${'999-99-9999'}`]) }]);
    expect(miss.false_negatives).toBe(1);
    expect(miss.recall).toBe(0);
    const extra = runEval([{ name: 'unexpected', text: 'Case 123-45-6789', expected: new Set() }]);
    expect(extra.false_positives).toBe(1);
    expect(extra.precision).toBe(0);
  });

  it('supports an optional NER hook for location-only fixtures', () => {
    const fixture = NER_ONLY_FIXTURES[0];
    const start = fixture.text.indexOf('Austin');
    const backend = (_text) => start < 0 ? [] : [[start, start + 6, 'location', 'Austin']];
    expect(runEval(NER_ONLY_FIXTURES, NER_AUGMENTED_POLICY).recall).toBe(0);
    const result = runEval(NER_ONLY_FIXTURES, NER_AUGMENTED_POLICY, backend);
    expect(result.precision).toBe(1);
    expect(result.recall).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import { loadBenchmark, searchHitRate } from './searchBenchmark';

// Regression floors for searchCorpus() on data/qa_benchmark.json; see
// documentation/44-qa-benchmark.md. Measured 2026-09-29 on the energy-
// cooperative sample corpus: 1.000 for both (0.908 / 0.938 on the earlier
// corpus). The floors were set on the earlier corpus and are kept: don't
// lower them to make a change pass.
const KEYWORD_HIT_AT_5_FLOOR = 0.88;
const QUESTION_HIT_AT_5_FLOOR = 0.9;

describe('search benchmark', () => {
  const questions = loadBenchmark();

  it('finds a gold source in the top 5 for keyword queries', () => {
    const rate = searchHitRate(questions, (q) => q.keywords);
    // eslint-disable-next-line no-console -- the measured rate is the useful output
    console.log(`search keyword hit@5: ${rate.toFixed(3)}`);
    expect(rate).toBeGreaterThanOrEqual(KEYWORD_HIT_AT_5_FLOOR);
  });

  it('finds a gold source in the top 5 for natural-language questions', () => {
    const rate = searchHitRate(questions, (q) => q.question.replace(/[?,.]/g, ''));
    // eslint-disable-next-line no-console -- the measured rate is the useful output
    console.log(`search natural-language hit@5: ${rate.toFixed(3)}`);
    expect(rate).toBeGreaterThanOrEqual(QUESTION_HIT_AT_5_FLOOR);
  });
});

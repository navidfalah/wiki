const { describe, expect, it } = require('vitest');
const path = require('node:path');
const { pairwiseEvaluate, runEval } = require(path.resolve(__dirname, '../../../compiler/entityResolutionEval.js'));
const { GOLD_MENTIONS } = require(path.resolve(__dirname, '../../../compiler/entityResolutionEvalDataset.js'));

describe('entity resolution evaluation', () => {
  it('scores pairwise-perfect clusters', () => {
    const gold = [[{ name: 'Mira Chen' }, 'mira'], [{ name: 'Mira' }, 'mira'], [{ name: 'Alex Kim' }, 'alex']];
    const report = pairwiseEvaluate([
      { id: 'e0', aliases: ['Mira Chen', 'Mira'] },
      { id: 'e1', aliases: ['Alex Kim'] },
    ], gold);
    expect(report.precision).toBe(1);
    expect(report.recall).toBe(1);
    expect(report.f1).toBe(1);
    expect(report.gold_pairs).toBe(1);
  });

  it('penalizes false merges and missed merges while preserving undefined recall', () => {
    const falseMerge = pairwiseEvaluate([{ id: 'e', aliases: ['Alex Kim', 'Alex Rivera'] }], [
      [{ name: 'Alex Kim' }, 'alex-kim'], [{ name: 'Alex Rivera' }, 'alex-rivera'],
    ]);
    expect(falseMerge.precision).toBe(0);
    expect(Number.isNaN(falseMerge.recall)).toBe(true);
    const missed = pairwiseEvaluate([{ id: 'a', aliases: ['Mira Chen'] }, { id: 'b', aliases: ['Mira'] }], [
      [{ name: 'Mira Chen' }, 'mira'], [{ name: 'Mira' }, 'mira'],
    ]);
    expect(missed.recall).toBe(0);
    expect(missed.gold_pairs).toBe(1);
  });

  it('records the exact-only pilot recall tradeoff', async () => {
    const report = await runEval();
    expect(report.predicted_pairs).toBe(0);
    expect(report.correct_pairs).toBe(0);
    expect(report.recall).toBe(0);
    expect(report.gold_pairs).toBeGreaterThan(0);
  });

  it('keeps the documented hard negative and positive clusters in the dataset', () => {
    const gold = Object.fromEntries(GOLD_MENTIONS.map(([mention, id]) => [mention.name, id]));
    expect(gold['Alex Kim']).not.toBe(gold['Alex Rivera']);
    expect(gold['Alex Rivera']).not.toBe(gold['Sam Rivera']);
    expect(gold['Aurora Nova Widget']).toBe(gold['Nova Widget']);
    expect(gold['SenseNode SN-400']).not.toBe(gold['Aurora Nova Widget']);
  });
});

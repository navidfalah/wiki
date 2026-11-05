const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { afterEach, describe, expect, it } = require('vitest');
const {
  correctionFromCandidate, loadCorrections, renderFewshotBlock, saveCorrection,
  selectReviewCandidates,
} = require('./activeLearning');

const tempDirs = [];
function tempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'active-learning-'));
  tempDirs.push(dir);
  return path.join(dir, 'corrections.json');
}
afterEach(() => { for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true }); });

function claim(id, quote = 'quote text') {
  return { id, source_path: `notes/${id}.md`, source_type: 'text', date: '2026-01-01', value: 'x', quote, gold_label: 'correct' };
}
function group(claims, relations = []) { return { id: 'g', domain: 't', subject: 't', description: 't', claims, relations }; }
function scores(...entries) {
  return Object.fromEntries(entries.map(([id, score]) => [id, { claim_id: id, prior: score, score, delta: 0, trust_level: 'medium' }]));
}

describe('active learning review loop', () => {
  it('flags low confidence claims and sorts by score', () => {
    const candidates = selectReviewCandidates(group([claim('a'), claim('b'), claim('c')]), scores(['a', 0.05], ['b', 0.02], ['c', 0.9]));
    expect(candidates.map((candidate) => candidate.claim_id)).toEqual(['b', 'a']);
    expect(candidates[0].reason).toBe('low_confidence');
  });

  it('flags unresolved contradictions and leaves resolved contradictions alone', () => {
    const input = group([claim('a'), claim('b')], [{ from_id: 'a', to_id: 'b', type: 'contradicts' }]);
    expect(selectReviewCandidates(input, scores(['a', 0.5], ['b', 0.52])).map(({ reason }) => reason))
      .toEqual(['unresolved_contradiction', 'unresolved_contradiction']);
    expect(selectReviewCandidates(input, scores(['a', 0.9], ['b', 0.1]), { lowConfidenceThreshold: 0 })).toEqual([]);
  });

  it('carries the quote, validates verdicts, and renders correction examples', () => {
    const candidate = { claim_id: 'a', group_id: 'g', reason: 'low_confidence', score: 0.1, quote: 'the original quote', source_path: 'a.md' };
    const correction = correctionFromCandidate(candidate, 'confirm_superseded', 'see changelog');
    expect(correction.quote_excerpt).toBe('the original quote');
    expect(renderFewshotBlock([correction])).toContain('confirm_superseded');
    expect(renderFewshotBlock([correction])).toContain('see changelog');
    expect(() => correctionFromCandidate(candidate, 'unknown', 'x')).toThrow('Unknown verdict');
    expect(renderFewshotBlock([])).toBe('');
  });

  it('round trips corrections, replaces only the same group and claim, and tolerates missing or malformed stores', () => {
    const file = tempFile();
    const first = { claim_id: 'a', group_id: 'g1', verdict: 'confirm_correct', note: 'first', quote_excerpt: 'q' };
    saveCorrection(first, file);
    saveCorrection({ ...first, verdict: 'confirm_incorrect', note: 'changed' }, file);
    saveCorrection({ ...first, group_id: 'g2', note: 'other group' }, file);
    expect(loadCorrections(file)).toHaveLength(2);
    expect(loadCorrections(file).find((item) => item.group_id === 'g1').note).toBe('changed');
    expect(loadCorrections(path.join(path.dirname(file), 'missing.json'))).toEqual([]);
    fs.writeFileSync(file, 'not json');
    expect(loadCorrections(file)).toEqual([]);
  });

  it('builds a review queue from the real pilot claim graph without listing the dispute-free group', () => {
    const { loadTrustEvalDataset } = require('./trustEvalDataset');
    const { selectReviewCandidatesForDataset } = require('./activeLearning');
    const { claim_groups } = loadTrustEvalDataset();
    const candidates = selectReviewCandidatesForDataset(claim_groups);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((candidate) => candidate.claim_id && candidate.group_id && Number.isFinite(candidate.score))).toBe(true);
    expect(candidates.some((candidate) => candidate.group_id === 'meshsync_relay_battery_drain_root_cause')).toBe(false);
  });
});

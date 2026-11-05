const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { afterEach, describe, expect, it } = require('vitest');
const { loadTrustEvalDataset, validateDataset, summaryStats, quoteIsGrounded, GOLD_LABELS, RELATION_TYPES } = require('./trustEvalDataset');

const tempDirs = [];
function tempRaw() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trust-eval-'));
  tempDirs.push(dir);
  return dir;
}
afterEach(() => { for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true }); });

function dataset({ goldLabel = 'correct', quote = 'The sky is blue.', relations = [] } = {}) {
  return { version: 1, description: 'test', claim_groups: [{ id: 'g1', domain: 'test', subject: 'test', description: 'test', claims: [{ id: 'c1', source_path: 'note.txt', source_type: 'text', date: '2026-01-01', value: 'blue', quote, gold_label: goldLabel }], relations }] };
}

describe('trust evaluation dataset', () => {
  it('loads and validates the grounded project dataset', async () => {
    const data = loadTrustEvalDataset();
    expect(await validateDataset(data)).toEqual([]);
    expect(data.claim_groups.length).toBeGreaterThanOrEqual(5);
    expect(data.claim_groups.flatMap((group) => group.claims).length).toBeGreaterThanOrEqual(20);
    const stats = summaryStats(data);
    expect(Object.keys(stats.claims_by_gold_label).every((label) => GOLD_LABELS.has(label))).toBe(true);
    expect(Object.keys(stats.relations_by_type).every((type) => RELATION_TYPES.has(type))).toBe(true);
    expect(stats.relations_by_type.contradicts).toBeGreaterThan(0);
    expect(stats.relations_by_type.corroborates).toBeGreaterThan(0);
    expect(stats.total_claims).toBe(Object.values(stats.claims_per_group).reduce((sum, count) => sum + count, 0));
  });

  it('detects invalid labels, ungrounded quotes, and relation endpoints', async () => {
    const raw = tempRaw();
    fs.writeFileSync(path.join(raw, 'note.txt'), 'The sky is blue.');
    const invalid = dataset({ goldLabel: 'not_a_real_label', quote: 'The sky is green.', relations: [{ from_id: 'c1', to_id: 'missing', type: 'corroborates' }] });
    const problems = await validateDataset(invalid, raw);
    expect(problems.some((problem) => problem.includes('unknown gold_label'))).toBe(true);
    expect(problems.some((problem) => problem.includes('quote not found verbatim'))).toBe(true);
    expect(problems.some((problem) => problem.includes("relation 'to' id not in group"))).toBe(true);
  });

  it('grounds bold and composite quotes while rejecting absent fragments', () => {
    const text = 'Default: every 15 minutes when mesh is active.\n\n> Note: kickoff notes mentioned hourly default.';
    expect(quoteIsGrounded('**Default: every 15 minutes when mesh is active.**', text)).toBe(true);
    expect(quoteIsGrounded('Default: every 15 minutes when mesh is active. [...] Note: kickoff notes mentioned hourly default.', text)).toBe(true);
    expect(quoteIsGrounded('Something not in the file.', text)).toBe(false);
  });
});
